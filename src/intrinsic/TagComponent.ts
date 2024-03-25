import { DomProps, setAttr, setStyle } from "../dom.js";
import { jsxPropNameToEventName } from "../utils.js";
import { MaybeSignal, useBatch, useEffect, useScope } from "../scope.js";
import { Fragment } from "./Fragment.js";
import {
  createTemplate,
  Template,
  runWithRenderer,
  useRenderer,
} from "../renderer.js";

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
          s._run(() =>
            useBatch(() => {
              listener(evt);
            }),
          );
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
    const renderer = useRenderer();
    const prevIsSvg = renderer._isSvg;

    if (tagName == "svg") {
      renderer._isSvg = true;
    }

    try {
      const node = hydrateElement(
        renderer._node(() =>
          !renderer._isSvg
            ? document.createElement(tagName)
            : document.createElementNS("http://www.w3.org/2000/svg", tagName),
        ),
        props,
      );

      if (props.children != null) {
        node.append(
          ...runWithRenderer((renderer) => {
            renderer._nodes = node.childNodes.values();
            return Fragment({ children: props.children }).build();
          }),
        );
      }

      return [node];
    } finally {
      renderer._isSvg = prevIsSvg;
    }
  });
