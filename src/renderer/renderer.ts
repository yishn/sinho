import {
  Component,
  FunctionComponent,
  FunctionComponentWrapper,
} from "./component.ts";
import { Scope, Destructor, Signal, SignalSetter } from "../scope.ts";
import { RendererScope } from "./renderer_scope.ts";

const nodeTypeSym = Symbol();
const renderingSym = Symbol();

export type Rendering<R extends Renderer> = (
  | RendererNode<R>
  | Rendering<R>
)[] & {
  [renderingSym]?: {
    component?: Component<any, R>;
    parent?: Rendering<R>;
    node?: RendererNode<R>;
  };
};

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

  _parentNodes = new WeakMap<N, N>();
  _mountListeners = new WeakMap<
    Component<any, Renderer<I, N>>,
    (() => void)[]
  >();

  abstract createIntrinsicComponent<T extends keyof I & string>(
    name: T,
    props: I[T]
  ): Component<any, this>;

  abstract appendNode(parent: N, node: N): void;
  abstract insertNode(node: N, before: N): void;
  abstract removeNode(node: N): void;

  private _fireMountListeners(rendering: Rendering<Renderer<I, N>>) {
    const component = rendering[renderingSym]?.component;

    if (component != null) {
      for (const listener of this._mountListeners.get(component) ?? []) {
        listener();
      }

      delete rendering[renderingSym]!.component;
      this._mountListeners.delete(component);
    }
  }

  appendRendering(rendering: Rendering<Renderer<I, N>>, parent: N): void {
    (rendering[renderingSym] ??= {}).node = parent;

    for (const node of rendering) {
      if (Array.isArray(node)) {
        (node[renderingSym] ??= {}).parent = rendering;
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
    rendering: Rendering<Renderer<I, N>>,
    parent: Rendering<Renderer<I, N>>
  ): void {
    this.insertIntoRendering(rendering, parent, parent.length);
  }

  insertRendering(rendering: Rendering<Renderer<I, N>>, before: N): void {
    const parent = this._parentNodes.get(before);
    if (parent != null) (rendering[renderingSym] ??= {}).node = parent;

    for (const node of rendering) {
      if (Array.isArray(node)) {
        (node[renderingSym] ??= {}).parent = rendering;

        this.insertRendering(node, before);
      } else {
        (rendering[renderingSym] ??= {}).node = parent;

        this.insertNode(node, before);
        this._elementNodeRefSetters.get(node)?.(node);
      }
    }

    this._fireMountListeners(rendering);
  }

  insertIntoRendering(
    rendering: Rendering<Renderer<I, N>>,
    parent: Rendering<Renderer<I, N>>,
    index: number
  ): void {
    const marker = this.getMarkerNode(parent, index);

    if (marker != null) {
      this.insertRendering(rendering, marker);
    } else {
      const node = parent[renderingSym]?.node;
      if (node != null) this.appendRendering(rendering, node);
    }

    parent.splice(index, 0, rendering);
  }

  removeRendering(rendering: Rendering<Renderer<I, N>>): void {
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
    parent: Rendering<Renderer<I, N>>,
    index: number
  ): N | Rendering<Renderer<I, N>> | undefined {
    const [result] = parent.splice(index, 1);

    if (Array.isArray(result)) {
      this.removeRendering(result);
    } else {
      this.removeNode(result);
    }

    return result;
  }

  getMarkerNode(
    rendering: Rendering<Renderer<I, N>> | undefined,
    index: number = 0
  ): N | undefined {
    if (rendering == null) {
      return undefined;
    } else if (index >= rendering.length) {
      const parentRendering = rendering[renderingSym]?.parent;

      return this.getMarkerNode(
        parentRendering,
        (parentRendering?.indexOf(rendering) ?? -1) + 1
      );
    } else if (Array.isArray(rendering[index])) {
      return this.getMarkerNode(rendering[index] as Rendering<Renderer<I, N>>);
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

  linkRenderingComponent(
    rendering: Rendering<Renderer<I, N>>,
    component: Component<any, Renderer<I, N>>
  ): void {
    (rendering[renderingSym] ??= {}).component = component;
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
