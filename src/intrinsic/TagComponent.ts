import { DomProps, setAttr, setStyle } from "../dom.js";
import { jsxPropNameToEventName } from "../utils.js";
import { MaybeSignal, useBatch, useEffect, useScope } from "../scope.js";
import { Fragment } from "./Fragment.js";
import { runWithRenderer, useRenderer } from "../renderer.js";
import { createTemplate, Template } from "../template.js";

export const hydrateElement = <E extends HTMLElement | SVGElement>(
  node: E,
  props: DomProps<any>,
): E => {
  const { ref, style, children, dangerouslySetInnerHTML, ...attrs } = props;

  for (const name in style ?? {}) {
    const value = style![name];
    const signal = value as MaybeSignal<string | number | null | undefined>;

    useEffect(() => {
      setStyle(node, name, MaybeSignal.get(signal));
    });
  }

  for (const name in attrs) {
    const value = attrs[name as keyof typeof attrs];

    if (name.startsWith("on")) {
      // Register event

      const listener = value as (evt: Event) => void;
      const s = useScope();

      node.addEventListener(
        jsxPropNameToEventName(name as `on${string}`),
        (evt) => {
          s._run(() => useBatch(() => listener(evt)));
        },
      );
    } else {
      // Set attribute

      useEffect(() => {
        setAttr(node, name, MaybeSignal.get(value));
      });
    }
  }

  if (dangerouslySetInnerHTML) {
    useEffect(() => {
      const html = dangerouslySetInnerHTML().__html;

      if (node.innerHTML != html) {
        node.innerHTML = html;
      }
    });
  }

  if (ref) {
    useEffect(() => {
      ref.set(node);
      return () => ref.set(undefined);
    });
  }

  return node;
};

export const TagComponent = (
  tagName: string,
  props: DomProps<any> = {},
): Template =>
  createTemplate(() => {
    const svg = tagName == "svg";
    const renderer = useRenderer();
    const node = hydrateElement(
      renderer._node(() =>
        !svg
          ? document.createElement(tagName)
          : document.createElementNS("http://www.w3.org/2000/svg", tagName),
      ),
      props,
    );

    if (props.children != null) {
      node.append(
        ...runWithRenderer(
          {
            _svg: svg,
            _nodes: node.childNodes.values(),
          },
          () => Fragment({ children: props.children }).build(),
        ),
      );
    }

    return [node];
  });
