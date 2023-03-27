import { Component } from "./component.ts";
import { Scope, Destructor, Signal, SignalSetter } from "../scope.ts";

type RenderingWithNode<N> = (N | RenderingWithNode<N>)[];

export type Rendering<R extends Renderer> = RenderingWithNode<RendererNode<R>>;

export type RendererNode<R extends Renderer> = R extends Renderer<
  infer _,
  infer N
>
  ? N
  : never;

export abstract class Renderer<in P = any, in out N extends object = any> {
  private _nodeRefSignals = new WeakMap<
    Signal<N | null>,
    SignalSetter<N | null>
  >();
  private _elementNodeRefSetters = new WeakMap<N, SignalSetter<N | null>>();

  _parentRenderings = new WeakMap<RenderingWithNode<N>, RenderingWithNode<N>>();
  _parentNodes = new WeakMap<N | RenderingWithNode<N>, N>();
  _renderingComponents = new WeakMap<
    RenderingWithNode<N>,
    Component<any, this>
  >();
  _mountListeners = new WeakMap<Component<any, this>, (() => void)[]>();

  abstract createNode(arg: P): N;

  abstract appendNode(parent: N, node: N): void;
  abstract insertNode(node: N, before: N): void;
  abstract removeNode(node: N): void;

  private _fireMountListeners(rendering: RenderingWithNode<N>) {
    const component = this._renderingComponents.get(rendering);

    if (component != null) {
      for (const listener of this._mountListeners.get(component) ?? []) {
        listener();
      }

      this._renderingComponents.delete(rendering);
      this._mountListeners.delete(component);
    }
  }

  appendRendering(rendering: RenderingWithNode<N>, parent: N): void {
    this._parentNodes.set(rendering, parent);

    for (const node of rendering) {
      if (Array.isArray(node)) {
        this._parentRenderings.set(node, rendering);
        this.appendRendering(node, parent);
      } else {
        this._parentNodes.set(node, parent);
        this.appendNode(parent, node);
        this._elementNodeRefSetters.get(node)?.(node);
      }
    }

    this._fireMountListeners(rendering);
  }

  appendToRendering(
    rendering: RenderingWithNode<N>,
    parent: RenderingWithNode<N>
  ): void {
    this.insertIntoRendering(rendering, parent, parent.length);
  }

  insertRendering(rendering: RenderingWithNode<N>, before: N): void {
    const parent = this._parentNodes.get(before);
    if (parent != null) this._parentNodes.set(rendering, parent);

    for (const node of rendering) {
      if (Array.isArray(node)) {
        this._parentRenderings.set(node, rendering);
        this.insertRendering(node, before);
      } else {
        if (parent != null) this._parentNodes.set(rendering, parent);
        this.insertNode(node, before);
        this._elementNodeRefSetters.get(node)?.(node);
      }
    }

    this._fireMountListeners(rendering);
  }

  insertIntoRendering(
    rendering: RenderingWithNode<N>,
    parent: RenderingWithNode<N>,
    index: number
  ): void {
    const marker = getMarker(this, parent as Rendering<this>, index) as
      | N
      | undefined;

    if (marker != null) {
      this.insertRendering(rendering, marker);
    } else {
      const node = this._parentNodes.get(parent);
      if (node != null) this.appendRendering(rendering, node);
    }

    parent.splice(index, 0, rendering);
  }

  removeRendering(rendering: RenderingWithNode<N>): void {
    for (const node of rendering) {
      if (Array.isArray(node)) {
        this.removeRendering(node);
      } else {
        this.removeNode(node);
        this._elementNodeRefSetters.get(node)?.(null);
      }
    }
  }

  removeFromRendering(
    parent: RenderingWithNode<N>,
    index: number
  ): N | RenderingWithNode<N> | undefined {
    const [result] = parent.splice(index, 1);

    if (Array.isArray(result)) {
      this.removeRendering(result);
    } else {
      this.removeNode(result);
    }

    return result;
  }

  nodeRef(s: Scope): Signal<N | null> {
    const [signal, setSignal] = s.signal<N | null>(null);
    this._nodeRefSignals.set(signal, setSignal);
    return signal;
  }

  linkNodeRef(signal: Signal<N | null>, element: N): void {
    const setter = this._nodeRefSignals.get(signal);

    if (setter != null) {
      this._elementNodeRefSetters.set(element, setter);
    }
  }
}

export function mount<R extends Renderer>(
  renderer: R,
  component: Component<any, R>,
  parent: RendererNode<R>
): Destructor {
  const s = new RendererScope(renderer);
  const [rendering, destructor] = component.renderWithDestructor(s);

  s.renderer.appendRendering(rendering, parent);

  return destructor;
}

export class RendererScope<out R extends Renderer> extends Scope {
  _current: Component<any, R> | undefined;

  constructor(public renderer: R) {
    super();
  }

  onMount(f: () => void): void {
    if (this._current == null) return;

    const currentSubscope = this.currentSubscope;
    let listeners = this.renderer._mountListeners.get(this._current);

    if (listeners == null) {
      listeners = [];
      this.renderer._mountListeners.set(this._current, listeners);
    }

    listeners.push(() => {
      const previousSubscope = this.currentSubscope;
      this.currentSubscope = currentSubscope;

      this.batch(() => {
        f();
      });

      this.currentSubscope = previousSubscope;
    });
  }
}

export function getMarker<R extends Renderer>(
  renderer: R,
  rendering: Rendering<R> | undefined,
  index: number = 0
): RendererNode<R> | undefined {
  if (rendering == null) {
    return undefined;
  } else if (index >= rendering.length) {
    const parentRendering = renderer._parentRenderings.get(rendering);
    return getMarker(
      renderer,
      parentRendering,
      (parentRendering?.indexOf(rendering) ?? -1) + 1
    );
  } else if (Array.isArray(rendering[index])) {
    return getMarker(renderer, rendering[index]);
  }

  return rendering[index] as RendererNode<R>;
}
