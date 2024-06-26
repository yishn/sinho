import { DomProps, setAttr, setStyle } from "../dom.js";
import { jsxPropNameToEventName } from "../utils.js";
import { MaybeSignal, useBatch, useEffect, useScope } from "../scope.js";
import { Fragment } from "./Fragment.js";
import { runWithRenderer, useRenderer } from "../renderer.js";
import { createTemplate, Template, TemplateNodes } from "../template.js";

export const hydrateElement = <E extends HTMLElement | SVGElement>(
  node: E,
  svg: boolean,
  props: DomProps<any>,
  heuristic?: boolean,
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

      const s = useScope();
      const listener = (evt: Event) => {
        s._run(() => useBatch(() => (value as (evt: Event) => void)(evt)));
      };

      const eventName = jsxPropNameToEventName(name as `on${string}`);

      useEffect(() => {
        node.addEventListener(eventName, listener);
        return () => node.removeEventListener(eventName, listener);
      });
    } else {
      // Set attribute

      useEffect(() => {
        setAttr(node, name, MaybeSignal.get(value), heuristic);
      });
    }
  }

  if (dangerouslySetInnerHTML) {
    useEffect(() => {
      const html = MaybeSignal.get(dangerouslySetInnerHTML).__html;

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

  if (props.children != null) {
    TemplateNodes.forEach(
      runWithRenderer(
        {
          _svg: svg,
          _nodes: node.childNodes.values(),
        },
        () => Fragment({ children: props.children }).build(),
      ),
      (subnode) => node.append(subnode),
    );
  }

  return node;
};

export const TagComponent = (
  tagName: string,
  props: DomProps<any> = {},
): Template =>
  createTemplate(() => {
    const renderer = useRenderer();
    const svg = tagName == "svg" ? true : !!renderer._svg;
    const node = hydrateElement(
      renderer._node(() =>
        !svg
          ? document.createElement(tagName)
          : document.createElementNS("http://www.w3.org/2000/svg", tagName),
      ),
      svg,
      props,
      true,
    );

    return [node];
  });
