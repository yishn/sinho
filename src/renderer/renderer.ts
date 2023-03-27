import {
  Component,
  ComponentConstructor,
  FunctionComponent,
  FunctionComponentWrapper,
} from "./component.ts";
import { Scope, Destructor, Signal, SignalSetter } from "../scope.ts";
import { RendererScope } from "./renderer_scope.ts";

declare const nodeTypeSym: unique symbol;

type RenderingWithNode<N> = (N | RenderingWithNode<N>)[];

export type Rendering<R extends Renderer> = RenderingWithNode<RendererNode<R>>;

export type RendererNode<R extends Renderer> = NonNullable<
  R[typeof nodeTypeSym]
>;

export abstract class Renderer<in P = any, in out N extends object = any> {
  [nodeTypeSym]?: N;

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

  abstract createSimpleComponent(name: string, props: P): Component<any, this>;

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
    const marker = this.getMarkerNode(parent, index);

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

  getMarkerNode(
    rendering: RenderingWithNode<N> | undefined,
    index: number = 0
  ): N | undefined {
    if (rendering == null) {
      return undefined;
    } else if (index >= rendering.length) {
      const parentRendering = this._parentRenderings.get(rendering);
      return this.getMarkerNode(
        parentRendering,
        (parentRendering?.indexOf(rendering) ?? -1) + 1
      );
    } else if (Array.isArray(rendering[index])) {
      return this.getMarkerNode(rendering[index] as RenderingWithNode<N>);
    }

    return rendering[index] as N;
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

  mount<R extends Renderer>(
    this: R,
    component: Component<any, R> | FunctionComponent<{}, R>,
    parent: N
  ): Destructor {
    const s = new RendererScope(this);
    const [rendering, destructor] = (
      component instanceof Component
        ? component
        : new FunctionComponentWrapper({}, component)
    ).renderWithDestructor(s);

    s.renderer.appendRendering(rendering, parent);

    return destructor;
  }
}
