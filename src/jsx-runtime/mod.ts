import { createElement } from "../create_element.js";
import type { Template } from "../template.js";
import type { DomEventProps, DomIntrinsicElements, DomProps } from "../dom.js";
import type { jsxPropsSym } from "../component.js";

/** @ignore */
export const jsx = (
  type: any,
  props?: object & { key?: unknown },
  key?: unknown,
): Template => {
  if (props && key != null) {
    props.key = key;
  }

  return createElement(type, props);
};

/** @ignore */
export namespace JSX {
  export type Element = Template;

  export type ElementClass = Omit<HTMLElement, typeof jsxPropsSym>;

  export interface ElementAttributesProperty {
    [jsxPropsSym]: {};
  }

  export interface ElementChildrenAttribute {
    children: {};
  }

  export type IntrinsicElements = DomIntrinsicElements;

  export interface IntrinsicClassAttributes<T>
    extends DomProps<T>,
      DomEventProps<T> {}
}

export { Fragment } from "../intrinsic/Fragment.js";
export { jsx as jsxDEV, jsx as jsxs };
