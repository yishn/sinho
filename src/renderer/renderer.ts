import {
  Component,
  FunctionComponent,
  FunctionComponentWrapper,
} from "./component.ts";
import { Scope, Destructor, Signal, SignalSetter } from "../scope.ts";
import { RendererScope } from "./renderer_scope.ts";
import { Rendering } from "./rendering.ts";

const nodeTypeSym = Symbol();

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
