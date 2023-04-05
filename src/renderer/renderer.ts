import {
  Children,
  Component,
  ComponentConstructor,
  ComponentProps,
  ComponentType,
  FunctionComponent,
  FunctionComponentWrapper,
} from "./component.ts";
import { Scope, Destructor, Signal, SignalSetter } from "../scope.ts";
import {
  RendererScope,
  _globals,
  getCurrentRendererScope,
} from "./renderer_scope.ts";
import { Rendering } from "./rendering.ts";

const nodeTypeSym = Symbol();

export type RendererNode<R extends Renderer> = NonNullable<
  R[typeof nodeTypeSym]
>;

export abstract class Renderer<in I = any, in out N extends object = any> {
  [nodeTypeSym]?: N;

  _nodeRefSignals = new WeakMap<Signal<N | null>, SignalSetter<N | null>>();
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

  createComponent<C extends (keyof I & string) | ComponentType<any, this>>(
    component: C,
    props?:
      | null
      | (C extends ComponentType<any, this>
          ? ComponentProps<C>
          : C extends keyof I
          ? I[C]
          : never),
    ...children: Children<this>[]
  ): Component<any, this> {
    type Self = this;

    props ??= {} as any;

    function isClassComponent(
      component: ComponentType<any, Self>
    ): component is ComponentConstructor<any, Self> {
      return !!component.isClassComponent;
    }

    if (children.length > 0) {
      const childrenOrChild = children.length === 1 ? children[0] : children;
      props!.children = childrenOrChild;
    }

    if (typeof component === "string") {
      return this.createIntrinsicComponent(
        component as keyof I & string,
        props!
      );
    } else if (isClassComponent(component)) {
      return new component(props);
    } else {
      return new FunctionComponentWrapper({
        name: component.name,
        functionComponent: (_, s) => component(props, s),
      });
    }
  }

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
    _globals.s = s;

    const [rendering, destructor] = (
      component instanceof Component
        ? component
        : new FunctionComponentWrapper({
            name: component.name,
            functionComponent: component,
          })
    ).renderWithDestructor(s);

    s.renderer.appendRendering(rendering, parent);
    _globals.s = undefined;

    return destructor;
  }
}

export function h<C extends string | ComponentType>(
  component: C,
  props?: null | (C extends ComponentType ? ComponentProps<C> : unknown),
  ...children: Children<any>[]
): Component {
  return getCurrentRendererScope().renderer.createComponent(
    component,
    props as any,
    ...children
  );
}
