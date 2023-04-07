import { Fragment, Renderer } from "../mod.ts";
import { JSX as _JSX, jsx } from "../jsx-runtime.ts";
import type { DomRenderer } from "./dom_renderer.ts";

export namespace JSX {
  export type Element = _JSX.Element;
  export type ElementChildrenAttribute = _JSX.ElementChildrenAttribute;

  export type IntrinsicElements = DomRenderer extends Renderer<infer I, infer _>
    ? I
    : never;
}

export { Fragment, jsx, jsx as jsxs, jsx as jsxDEV };
