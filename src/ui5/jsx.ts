import { Component, ComponentProps } from "../renderer/mod.ts";
import { Aggregation } from "./control.ts";
import { Ui5Renderer } from "./ui5_renderer.ts";

export function h(
  type: string,
  props?: {},
  ...children: Component<any, Ui5Renderer>[]
): Aggregation;
export function h<T extends new (props: any) => Component<any, Ui5Renderer>>(
  type: T,
  props: ComponentProps<InstanceType<T>>,
  ...children: Component<any, Ui5Renderer>[]
): InstanceType<T>;
export function h(
  type: string | (new (props: any) => Component<any, Ui5Renderer>),
  props: any,
  ...children: any[]
): Component<any, Ui5Renderer> {
  if (children.length === 1) children = children[0];

  if (typeof type === "string") {
    return new Aggregation({
      name: type,
      children,
    });
  } else {
    return new type({ children, ...props });
  }
}

export interface Ui5Event<T, P> {
  getSource(): T;
  getParameters(): P;
}

export interface Ui5EventHandler<T, P> {
  (evt: Ui5Event<T, P>): void;
}

declare global {
  namespace JSX {
    interface Element extends Component<any, Ui5Renderer> {}

    interface ElementChildrenAttribute {
      children: {};
    }

    interface IntrinsicElements {
      [aggregation: string]: {};
    }
  }
}
