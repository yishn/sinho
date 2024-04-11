import { createElement } from "../create_element.js";
import { FunctionalComponent } from "../component.js";
import { Text } from "./Text.js";
import { MaybeSignal } from "../scope.js";
import { Fragment } from "./Fragment.js";
import { useRenderer } from "../renderer.js";
import { Portal } from "./Portal.js";

const styleSheetRegistry = new Map<string, CSSStyleSheet>();

export const Style: FunctionalComponent<{
  global?: boolean;
  children?: MaybeSignal<string>;
}> = (props) => {
  const dynamic = typeof props.children == "function";

  // Dynamic CSS will be inserted into the DOM as a <style> element.

  if (dynamic) {
    const styleEl = createElement(
      "style",
      {},
      Text({
        text: props.children,
        marker: false,
      }),
    );

    return props.global
      ? Portal({ mount: document.head, children: styleEl })
      : styleEl;
  }

  // Static CSS will be inserted as an adopted stylesheet and cached.

  const renderer = useRenderer();
  const css = props.children as string | undefined;

  if (css) {
    if (!styleSheetRegistry.has(css)) {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      styleSheetRegistry.set(css, sheet);
    }

    (props.global
      ? document
      : renderer._component?.shadowRoot ?? document
    ).adoptedStyleSheets.push(styleSheetRegistry.get(css)!);
  }

  return Fragment({});
};

export const css = (
  strings: TemplateStringsArray,
  ...values: MaybeSignal<string | number>[]
): MaybeSignal<string> => {
  const result = () =>
    strings.reduce(
      (acc, string, i) => acc + string + (MaybeSignal.get(values[i]) ?? ""),
      "",
    );

  return values.some((value) => typeof value == "function") ? result : result();
};
