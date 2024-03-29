import { createElement } from "../create_element.js";
import type { Template } from "../renderer.js";
import type { DomIntrinsicElements } from "../dom.js";
import type { RefSignalSetter } from "../ref.js";
import type { _jsxPropsSym, Component } from "../component.js";

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

  export type ElementClass = Omit<Component, typeof _jsxPropsSym>;

  export interface ElementAttributesProperty {
    [_jsxPropsSym]: {};
  }

  export interface ElementChildrenAttribute {
    children: {};
  }

  export type IntrinsicElements = DomIntrinsicElements;

  export interface IntrinsicClassAttributes<T> {
    ref?: RefSignalSetter<T | undefined>;
  }
}

export { Fragment } from "../intrinsic/Fragment.js";
export { jsx as jsxDEV, jsx as jsxs };
