import { Component, ComponentProps, ComponentType, Fragment } from "../mod.ts";
import type { DomIntrinsicElements } from "./dom.ts";
import type { DomRenderer } from "./dom_renderer.ts";
import { jsx as _jsx } from "../jsx-runtime.ts";

export function jsx<C extends string | ComponentType<any, DomRenderer>>(
  component: C,
  props?: null | (C extends ComponentType ? ComponentProps<C> : unknown),
  _key?: string
): Component<any, DomRenderer> {
  return _jsx(component, props);
}

export namespace JSX {
  export interface Element extends Component<any, DomRenderer> {}

  export interface ElementChildrenAttribute {
    children: {};
  }

  export interface IntrinsicElements extends DomIntrinsicElements {}
}

export { Fragment, jsx as jsxs, jsx as jsxDEV };
