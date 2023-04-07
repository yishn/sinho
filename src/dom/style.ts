import generateHash from "https://cdn.skypack.dev/@emotion/hash/dist/emotion-hash.esm.js";
import {
  Children,
  Component,
  For,
  Fragment,
  Rendering,
  createContext,
  _globals,
  Signal,
} from "../mod.ts";
import { setAttr } from "./dom.ts";
import { jsx } from "./jsx-runtime.ts";
import { DomRenderer } from "./dom_renderer.ts";

const selectorSym = Symbol("selector");
const StylesContext = createContext<{
  prefix: string;
  insertStyle: (hash: string, css: string) => void;
}>();

type Selector = typeof selectorSym;

export interface StylesProviderProps {
  prefix?: string;
  children?: Children;
}

export class StylesProvider extends Component<StylesProviderProps> {}

StylesProvider.implRender(DomRenderer, (component, s) => {
  if (s.get(StylesContext) != null) {
    // StylesProvider is already an ancestor component, do nothing
    return new Fragment({ children: component.props.children }).render(s);
  }

  const [stylesState, setStylesState] = s.signal({
    hashs: new Map<string, number>(),
    styles: [] as {
      hash: string;
      rules: string;
    }[],
  });

  s.onMount(() => {
    const stylesRendering = new For({
      source: () => stylesState().styles,
      children: (style) =>
        jsx("style", {
          "data-hash": style().hash,
          children: style().rules,
        }),
    }).render(s);

    s.renderer.appendRendering(stylesRendering, document.head);

    s.cleanup(() => s.renderer.removeRendering(stylesRendering));
  });

  return new StylesContext.Provider({
    value: {
      prefix: component.props.prefix ?? "css-",
      insertStyle(hash, rules) {
        if (!stylesState().hashs.has(hash)) {
          setStylesState(
            (stylesState) => {
              stylesState.hashs.set(hash, stylesState.styles.length);
              stylesState.styles.push({ hash, rules });

              return stylesState;
            },
            { force: true }
          );
        }
      },
    },
    children: component.props.children,
  }).render(s);
});

export interface CssInfo {
  css: string;
  id: string;
  strings: ReadonlyArray<string>;
  values: (Selector | string)[];
  variables: [string, string][];
}

function cssInner(
  prefix: string,
  hash: string,
  strings: ReadonlyArray<string>,
  ...values: (Selector | string)[]
): CssInfo {
  let css = "";
  const variables = [] as [string, string][];
  const id = prefix + hash;

  for (let i = 0; i < strings.length; i++) {
    css += strings[i];

    const value = values[i];
    if (value == null) continue;

    if (value === selectorSym) {
      css += `[data-${id}]`;
    } else {
      const variableName = `--${id}-${variables.length}`;
      variables.push([variableName, value]);
      css += `var(${variableName})`;
    }
  }

  return {
    css,
    id,
    strings,
    values,
    variables,
  };
}

export function css(
  strings: ReadonlyArray<string>,
  ...values: (Selector | string)[]
): CssInfo {
  return cssInner("", "&", strings, ...values);
}

export interface StyleProps {
  targetRef?: Signal<ElementCSSInlineStyle | null>;
  children?: (selector: Selector) => CssInfo;
}

export class Style extends Component<StyleProps> {}

Style.implRender(DomRenderer, (component, s) => {
  const getGenericCssInfo = component.props.children;
  if (getGenericCssInfo == null) return new Rendering(s);

  const context = s.get(StylesContext);

  if (context == null) {
    throw new Error(
      "styled component has to be descendant of `StylesProvider`"
    );
  }

  let hash: string | undefined;

  s.effect(() => {
    const element = component.props.targetRef?.();

    if (element === undefined || element != null) {
      const genericCssInfo = getGenericCssInfo(selectorSym);
      hash ??= generateHash(genericCssInfo.css);

      const cssInfo = cssInner(
        context.prefix,
        hash,
        genericCssInfo.strings,
        ...genericCssInfo.values
      );

      const variablesCss = cssInfo.variables
        .map(([name, value]) => `${name}:${value};`)
        .join("");
      const variablesHash = generateHash(variablesCss);
      const variablesId = context.prefix + variablesHash;

      context.insertStyle(hash, cssInfo.css);
      context.insertStyle(
        variablesHash,
        `[data-${variablesId}]{${variablesCss}}`
      );

      setAttr(element, `data-${cssInfo.id}`, "");
      setAttr(element, `data-${variablesId}`, "");

      s.cleanup(() => {
        setAttr(element, `data-${variablesId}`, undefined);
      });
    }
  });

  return new Rendering(s);
});
