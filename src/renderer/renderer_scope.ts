import { Scope } from "../scope.ts";
import {
  Component,
  ComponentConstructor,
  ComponentProps,
  ComponentType,
  FunctionComponentWrapper,
} from "./component.ts";
import { Renderer } from "./renderer.ts";

export class RendererScope<out R extends Renderer> extends Scope {
  _current: Component<any, R> | undefined;

  constructor(public renderer: R) {
    super();
  }

  createComponent<
    C extends
      | (R extends Renderer<infer I, infer _> ? keyof I & string : never)
      | ComponentType<any, R>
  >(
    component: C,
    props: C extends ComponentType<any, R>
      ? ComponentProps<C>
      : R extends Renderer<infer I, infer _>
      ? C extends keyof I
        ? I[C]
        : never
      : never,
    ...children: Component<any, R>[]
  ): Component<any, R> {
    function isClassComponent(
      component: ComponentType<any, R>
    ): component is ComponentConstructor<any, R> {
      return !!component.isClassComponent;
    }

    const childrenOrChild = children.length === 1 ? children[0] : children;
    const propsWithChildren = {
      children: childrenOrChild,
      ...props,
    };

    if (typeof component === "string") {
      return this.renderer.createIntrinsicComponent(
        component,
        propsWithChildren
      );
    } else if (isClassComponent(component)) {
      return new component(propsWithChildren);
    } else {
      return new FunctionComponentWrapper({
        functionComponent: (s) => component(propsWithChildren, s),
      });
    }
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
