import {
  ComponentConstructor,
  FunctionalComponent,
  isComponent,
  JsxProps,
  Metadata,
} from "./component.js";
import { DomIntrinsicElements, DomProps } from "./dom.js";
import { Children } from "./intrinsic/Fragment.js";
import { TagComponent } from "./intrinsic/TagComponent.js";
import { ClassComponent } from "./intrinsic/ClassComponent.js";
import { Template, createTemplate } from "./template.js";

/**
 * Creates a template based on the given component type.
 *
 * @example
 * ```tsx
 * render() {
 *   return createElement("div", { id: "app" }, [
 *     createElement("h1", {}, "Hello, World!"),
 *   ]);
 * }
 * ```
 */
export const createElement: (<K extends keyof DomIntrinsicElements & string>(
  type: K,
  props?: DomIntrinsicElements[K],
  children?: Children,
) => Template) &
  (<T extends HTMLElement, M extends Metadata>(
    ...args: [
      type: new () => T,
      ...({} extends JsxProps<T>
        ? [props?: JsxProps<T>]
        : [props: JsxProps<T>]),
      children?: DomProps<T>["children"],
    ]
  ) => Template) &
  (<P extends object>(
    ...args: [
      type: FunctionalComponent<P>,
      ...({} extends P ? [props?: P] : [props: P]),
      ...(P extends { children?: unknown }
        ? undefined extends P["children"]
          ? [children?: P["children"]]
          : [children: P["children"]]
        : []),
    ]
  ) => Template) = ((
  type:
    | (keyof DomIntrinsicElements & string)
    | ComponentConstructor
    | FunctionalComponent,
  props: Record<string, unknown> = {},
  children?: Children,
): Template => {
  if (children != null) {
    (props as any).children = children;
  }

  return isComponent(type)
    ? ClassComponent(type, props)
    : typeof type == "function"
      ? createTemplate(() => type(props))
      : TagComponent(type, props);
}) as any;

/**
 * Shorthand for {@link createElement} with convenience methods for intrinsic
 * elements.
 *
 * @example
 * ```tsx
 * render() {
 *   return h.div({ id: "app" }, [
 *     h.h1({}, "Hello, World!"),
 *   ]);
 * }
 * ```
 */
export const h: typeof createElement & {
  [K in keyof DomIntrinsicElements]: (
    props?: DomIntrinsicElements[K],
    children?: Children,
  ) => Template;
} = new Proxy(createElement, {
  get: (target, type) => (props?: object, children?: Children) =>
    target(type as string, props, children),
}) as any;
