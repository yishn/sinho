import {
  Component,
  ComponentProps,
  ComponentType,
  Fragment,
  getCurrentRendererScope,
} from "./mod.ts";

export function jsx<C extends string | ComponentType>(
  component: C,
  props?: null | (C extends ComponentType ? ComponentProps<C> : unknown),
  key?: string
): Component {
  if (props != null && key != null) {
    (props as any).key = key;
  }

  return getCurrentRendererScope().renderer.createComponent(component, props);
}

export namespace JSX {
  export type Element = Component;

  export interface ElementChildrenAttribute {
    children: {};
  }

  export type IntrinsicElements = Record<string, any>;
}

export { Fragment, jsx as jsxs, jsx as jsxDEV };
