import {
  Component,
  FunctionComponent,
  FunctionComponentWrapper,
} from "./component.ts";
import { Scope, Destructor, Signal, SignalSetter } from "../scope.ts";
import { RendererScope } from "./renderer_scope.ts";

const nodeTypeSym = Symbol();

export type RendererNode<R extends Renderer> = NonNullable<
  R[typeof nodeTypeSym]
>;

export class Rendering<R extends Renderer> {
  component?: Component<any, R>;
  parent?: Rendering<R>;
  node?: RendererNode<R>;

  constructor(
    protected s: RendererScope<R>,
    protected data: (RendererNode<R> | Rendering<R>)[] = []
  ) {}

  [Symbol.iterator]() {
    return this.data[Symbol.iterator]();
  }

  getMarkerNode(index: number = 0): RendererNode<R> | undefined {
    if (index >= this.data.length) {
      const parentRendering = this.parent;

      return parentRendering?.getMarkerNode(
        (parentRendering?.data.indexOf(this) ?? -1) + 1
      );
    } else if (this.data[index] instanceof Rendering) {
      return (this.data[index] as Rendering<R>).getMarkerNode();
    }

    return this.data[index];
  }

  append(rendering: Rendering<R>): void {
    this.insert(rendering, this.data.length);
  }

  insert(rendering: Rendering<R>, index: number): void {
    const marker = this.getMarkerNode(index);

    if (marker != null) {
      this.s.renderer.insertRendering(rendering, marker);
    } else {
      const node = this.node;
      if (node != null) this.s.renderer.appendRendering(rendering, node);
    }

    this.data.splice(index, 0, rendering);
  }

  delete(index: number): RendererNode<R> | Rendering<R> | undefined {
    const [result] = this.data.splice(index, 1);

    if (result instanceof Rendering) {
      this.s.renderer.removeRendering(result);
    } else {
      this.s.renderer.removeNode(result);
    }

    return result;
  }
}

export abstract class Renderer<in I = any, in out N extends object = any> {
  [nodeTypeSym]?: N;

  private _nodeRefSignals = new WeakMap<
    Signal<N | null>,
    SignalSetter<N | null>
  >();
  private _elementNodeRefSetters = new WeakMap<N, SignalSetter<N | null>>();

  _parentNodes = new WeakMap<N, N>();
  _mountListeners = new WeakMap<Component<any, this>, (() => void)[]>();

  abstract createIntrinsicComponent<T extends keyof I & string>(
    name: T,
    props: I[T]
  ): Component<any, this>;

  abstract appendNode(parent: N, node: N): void;
  abstract insertNode(node: N, before: N): void;
  abstract removeNode(node: N): void;

  private _fireMountListeners(rendering: Rendering<this>) {
    const component = rendering.component;

    if (component != null) {
      for (const listener of this._mountListeners.get(component) ?? []) {
        listener();
      }

      delete rendering.component;
      this._mountListeners.delete(component);
    }
  }

  appendRendering(rendering: Rendering<this>, parent: N): void {
    rendering.node = parent;

    for (const node of rendering) {
      if (node instanceof Rendering) {
        node.parent = rendering;
        this.appendRendering(node, parent);
      } else {
        this._parentNodes.set(node, parent);
        this.appendNode(parent, node);
        this._elementNodeRefSetters.get(node)?.(node);
      }
    }

    this._fireMountListeners(rendering);
  }

  insertRendering(rendering: Rendering<this>, before: N): void {
    const parent = this._parentNodes.get(before);
    if (parent != null) rendering.node = parent;

    for (const node of rendering) {
      if (node instanceof Rendering) {
        node.parent = rendering;
        this.insertRendering(node, before);
      } else {
        rendering.node = parent;
        this.insertNode(node, before);
        this._elementNodeRefSetters.get(node)?.(node);
      }
    }

    this._fireMountListeners(rendering);
  }

  removeRendering(rendering: Rendering<this>): void {
    for (const node of rendering) {
      if (node instanceof Rendering) {
        this.removeRendering(node);
      } else {
        this.removeNode(node);
        this._elementNodeRefSetters.get(node)?.(null);
      }
    }
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
    rendering: Rendering<this>,
    component: Component<any, this>
  ): void {
    rendering.component = component;
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
        : new FunctionComponentWrapper({ functionComponent: component })
    ).renderWithDestructor(s);

    s.renderer.appendRendering(rendering, parent);

    return destructor;
  }
}
