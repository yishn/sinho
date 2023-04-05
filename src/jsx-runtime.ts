import {
  Component,
  ComponentProps,
  ComponentType,
  Fragment,
  h,
} from "./mod.ts";

export function jsx<C extends string | ComponentType>(
  component: C,
  props?: null | (C extends ComponentType ? ComponentProps<C> : unknown),
  _key?: string
): Component {
  return h(component, props);
}

export namespace JSX {
  export interface Element extends Component {}

  export interface ElementChildrenAttribute {
    children: {};
  }

  export interface IntrinsicElements {
    [name: string]: any;
  }
}

export { Fragment, jsx as jsxs, jsx as jsxDEV };
