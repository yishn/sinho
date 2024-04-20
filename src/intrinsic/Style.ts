import { createElement } from "../create_element.js";
import { FunctionalComponent } from "../component.js";
import { Text } from "./Text.js";
import { MaybeSignal, useEffect } from "../scope.js";
import { Fragment } from "./Fragment.js";
import { useRenderer } from "../renderer.js";
import { Portal } from "./Portal.js";

const styleSheetRegistrySym = Symbol("styleSheetRegistry");

type StyleSheetRegistry = Map<
  string,
  {
    _sheet: CSSStyleSheet;
    _refs: number;
  }
>;

const getStyleSheetRegistry = <T>(
  obj: T & { [styleSheetRegistrySym]?: StyleSheetRegistry },
): StyleSheetRegistry => (obj[styleSheetRegistrySym] ??= new Map());

export const Style: FunctionalComponent<{
  light?: boolean;
  children?: MaybeSignal<string>;
}> = (props) => {
  const css = props.children;

  // Dynamic CSS will be inserted into the DOM as a <style> element.

  if (typeof css == "function") {
    const styleEl = createElement(
      "style",
      {},
      Text({
        text: css,
        marker: false,
      }),
    );

    return props.light
      ? Portal({ mount: document.head, children: styleEl })
      : styleEl;
  }

  // Static CSS will be inserted as an adopted stylesheet and cached.

  if (css) {
    const renderer = useRenderer();
    const styleRoot = props.light
      ? document
      : renderer._component?.shadowRoot ?? document;
    const styleSheetRegistry = getStyleSheetRegistry(styleRoot);

    if (!styleSheetRegistry.has(css)) {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      styleSheetRegistry.set(css, {
        _sheet: sheet,
        _refs: 0,
      });
    }

    const entry = styleSheetRegistry.get(css)!;
    entry._refs++;

    styleRoot.adoptedStyleSheets.push(entry._sheet);

    useEffect(() => () => {
      if (--entry._refs == 0) {
        styleRoot.adoptedStyleSheets = styleRoot.adoptedStyleSheets.filter(
          (sheet) => sheet != entry._sheet,
        );
        styleSheetRegistry.delete(css);
      }
    });
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
