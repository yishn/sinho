import { createElement } from "../create_element.js";
import { FunctionalComponent } from "../component.js";
import { Text } from "./Text.js";
import { MaybeSignal, useEffect } from "../scope.js";
import { Fragment } from "./Fragment.js";
import { useRenderer } from "../renderer.js";
import { Portal } from "./Portal.js";

type StyleSheetRegistry = Map<
  string,
  {
    _sheet: CSSStyleSheet;
    _refs: number;
  }
>;

const styleSheetRegistrySym = Symbol("styleSheetRegistry");
const globalStyleSheetRegistry: StyleSheetRegistry = new Map();

const getLocalStyleSheetRegistry = <T>(
  obj: T & { [styleSheetRegistrySym]?: StyleSheetRegistry },
): StyleSheetRegistry => (obj[styleSheetRegistrySym] ??= new Map());

const useStyleSheet = (
  registry: StyleSheetRegistry,
  css: string,
  cleanup: () => void,
): CSSStyleSheet => {
  if (!globalStyleSheetRegistry.has(css)) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    globalStyleSheetRegistry.set(css, {
      _sheet: sheet,
      _refs: 0,
    });
  }

  const globalEntry = globalStyleSheetRegistry.get(css)!;
  globalEntry._refs++;

  if (!registry.has(css)) {
    registry.set(css, {
      _sheet: globalEntry._sheet,
      _refs: 0,
    });
  }

  const entry = registry.get(css)!;
  entry._refs++;

  useEffect(() => () => {
    if (!--entry._refs) {
      registry.delete(css);
      cleanup();
    }

    if (!--globalEntry._refs) {
      globalStyleSheetRegistry.delete(css);
    }
  });

  return entry._sheet;
};

export const Style: FunctionalComponent<{
  light?: boolean;
  children?: MaybeSignal<string>;
}> = (props) => {
  const css = props.children;

  if (typeof css == "function") {
    // Dynamic CSS will be inserted into the DOM as a <style> element.

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
    const registry = getLocalStyleSheetRegistry(styleRoot);

    const sheet = useStyleSheet(registry, css, () => {
      styleRoot.adoptedStyleSheets = styleRoot.adoptedStyleSheets.filter(
        (s) => s != sheet,
      );
    });

    styleRoot.adoptedStyleSheets.push(sheet);
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
