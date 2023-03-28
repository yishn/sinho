import {
  Component,
  FunctionComponent,
  FunctionComponentWrapper,
} from "./component.ts";
import { Scope, Destructor, Signal, SignalSetter } from "../scope.ts";
import { RendererScope } from "./renderer_scope.ts";

const nodeTypeSym = Symbol();

type RenderingWithNode<N> = (N | RenderingWithNode<N>)[];

export type Rendering<R extends Renderer> = RenderingWithNode<RendererNode<R>>;

export type RendererNode<R extends Renderer> = NonNullable<
  R[typeof nodeTypeSym]
>;

export abstract class Renderer<in I = any, in out N extends object = any> {
  [nodeTypeSym]?: N;

  private _nodeRefSignals = new WeakMap<
    Signal<N | null>,
    SignalSetter<N | null>
  >();
  private _elementNodeRefSetters = new WeakMap<N, SignalSetter<N | null>>();

  _parentRenderings = new WeakMap<Rendering<this>, Rendering<this>>();
  _parentNodes = new WeakMap<N | Rendering<this>, N>();
  _renderingComponents = new WeakMap<Rendering<this>, Component<any, this>>();
  _mountListeners = new WeakMap<Component<any, this>, (() => void)[]>();

  abstract createIntrinsicComponent<T extends keyof I & string>(
    name: T,
    props: I[T]
  ): Component<any, this>;

  abstract appendNode(parent: N, node: N): void;
  abstract insertNode(node: N, before: N): void;
  abstract removeNode(node: N): void;

  private _fireMountListeners(rendering: Rendering<this>) {
    const component = this._renderingComponents.get(rendering);

    if (component != null) {
      for (const listener of this._mountListeners.get(component) ?? []) {
        listener();
      }

      this._renderingComponents.delete(rendering);
      this._mountListeners.delete(component);
    }
  }

  appendRendering(rendering: Rendering<this>, parent: N): void {
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

  appendToRendering(rendering: Rendering<this>, parent: Rendering<this>): void {
    this.insertIntoRendering(rendering, parent, parent.length);
  }

  insertRendering(rendering: Rendering<this>, before: N): void {
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
    rendering: Rendering<this>,
    parent: Rendering<this>,
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

  removeRendering(rendering: Rendering<this>): void {
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
    parent: Rendering<this>,
    index: number
  ): N | Rendering<this> | undefined {
    const [result] = parent.splice(index, 1);

    if (Array.isArray(result)) {
      this.removeRendering(result);
    } else {
      this.removeNode(result);
    }

    return result;
  }

  getMarkerNode(
    rendering: Rendering<this> | undefined,
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
      return this.getMarkerNode(rendering[index] as Rendering<this>);
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
        : new FunctionComponentWrapper({
            functionComponent: (s) => component({}, s),
          })
    ).renderWithDestructor(s);

    s.renderer.appendRendering(rendering, parent);

    return destructor;
  }
}
