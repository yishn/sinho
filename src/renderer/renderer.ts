import { Component } from "./component.ts";
import { Scope, Destructor, EffectOptions } from "../scope.ts";

type RenderingWithNode<N> = (N | RenderingWithNode<N>)[];

export type Rendering<R extends Renderer> = RenderingWithNode<RendererNode<R>>;

export type RendererNode<R extends Renderer> = R extends Renderer<
  infer _,
  infer N
>
  ? N
  : never;

export abstract class Renderer<in P = any, out N extends object = any> {
  _renderingComponents = new WeakMap<
    RenderingWithNode<N>,
    Component<any, this>
  >();
  _mountListeners = new WeakMap<Component<any, this>, (() => void)[]>();

  abstract createNode(arg: P): N;
  abstract createMarkerNode(): N;

  abstract appendNode(parent: N, node: N): void;
  abstract insertNode(node: N, before: N): void;
  abstract removeNode(node: N): void;

  private fireMountListeners(rendering: RenderingWithNode<N>) {
    const component = this._renderingComponents.get(rendering);

    if (component != null) {
      for (const listener of this._mountListeners.get(component) ?? []) {
        listener();
      }

      this._renderingComponents.delete(rendering);
      this._mountListeners.delete(component);
    }
  }

  appendRendering(parent: N, rendering: RenderingWithNode<N>): void {
    for (const node of rendering) {
      if (Array.isArray(node)) {
        this.appendRendering(parent, node);
      } else {
        this.appendNode(parent, node);
      }
    }

    this.fireMountListeners(rendering);
  }

  insertRendering(rendering: RenderingWithNode<N>, before: N): void {
    for (const node of rendering) {
      if (Array.isArray(node)) {
        this.insertRendering(node, before);
      } else {
        this.insertNode(node, before);
      }
    }

    this.fireMountListeners(rendering);
  }

  removeRendering(rendering: RenderingWithNode<N>): void {
    for (const node of rendering) {
      if (Array.isArray(node)) {
        this.removeRendering(node);
      } else {
        this.removeNode(node);
      }
    }
  }
}

export function mount<R extends Renderer>(
  renderer: R,
  component: Component<any, R>,
  parent: RendererNode<R>
): Destructor {
  const s = new RendererScope(renderer);
  const [rendering, destructor] = component.createRenderingWithDestructor(s);

  s.renderer.appendRendering(parent, rendering);

  return destructor;
}

export class RendererScope<out R extends Renderer> extends Scope {
  _currentComponent: Component<any, R> | undefined;

  constructor(public renderer: R) {
    super();
  }

  onMount(f: () => void): void {
    const component = this._currentComponent;
    if (component == null) return;

    let listeners = this.renderer._mountListeners.get(component);

    if (listeners == null) {
      listeners = [];
      this.renderer._mountListeners.set(component, listeners);
    }

    listeners.push(() => {
      this.batch(() => {
        f();
      });
    });
  }
}
