/** @jsx h */

import generateHash from "https://cdn.skypack.dev/@emotion/hash/dist/emotion-hash.esm.js";
import {
  h,
  Children,
  Component,
  For,
  Fragment,
  RendererScope,
  createContext,
  _globals,
  getCurrentRendererScope,
} from "../mod.ts";
import { DomRenderer } from "./mod.ts";
import { Rendering } from "../renderer/rendering.ts";

const selectorSym = Symbol("selector");
const StylesContext = createContext<{
  prefix: string;
  addStyle: (hash: string, rules: string) => void;
}>();

type Selector = typeof selectorSym;

export interface StylesProviderProps {
  classPrefix?: string;
  children?: Children<DomRenderer>;
}

export class StylesProvider extends Component<
  StylesProviderProps,
  DomRenderer
> {
  render(s: RendererScope<DomRenderer>): Rendering<DomRenderer> {
    if (s.get(StylesContext) != null) {
      // StylesProvider is already an ancestor component, do nothing
      return new Fragment({ children: this.props.children }).render(s);
    }

    const [stylesState, setStylesState] = s.signal({
      hashs: new Map<string, number>(),
      styles: [] as {
        hash: string;
        rules: string;
      }[],
    });

    s.onMount(() => {
      const stylesRendering = (
        <For source={() => stylesState().styles}>
          {(style) => (
            <style data-hash={style().hash}>{() => style().rules}</style>
          )}
        </For>
      ).render(s);

      s.renderer.appendRendering(stylesRendering, document.head);

      s.cleanup(() => s.renderer.removeRendering(stylesRendering));
    });

    return (
      <StylesContext.Provider
        value={{
          prefix: this.props.classPrefix ?? "css-",
          addStyle(hash, rules) {
            setStylesState(
              (stylesState) => {
                if (!stylesState.hashs.has(hash)) {
                  stylesState.hashs.set(hash, stylesState.styles.length);
                  stylesState.styles.push({ hash, rules });
                } else {
                  const i = stylesState.hashs.get(hash)!;
                  stylesState.styles[i] = { hash, rules };
                }

                return stylesState;
              },
              { force: true }
            );
          },
        }}
      >
        {this.props.children}
      </StylesContext.Provider>
    ).render(s);
  }
}

export interface CssInfo {
  css: string;
  className: string;
  strings: TemplateStringsArray;
  values: (Selector | string)[];
  variables: [string, string][];
}

function cssInner(
  prefix: string,
  hash: string,
  strings: TemplateStringsArray,
  ...values: (Selector | string)[]
): CssInfo {
  let css = "";
  const variables = [] as [string, string][];
  const className = prefix + hash;

  for (let i = 0; i < strings.length; i++) {
    css += strings[i];

    const value = values[i];
    if (value == null) continue;

    if (value === selectorSym) {
      css += `.${className}`;
    } else {
      const variableName = `--${className}-${variables.length}`;
      variables.push([variableName, value]);
      css += `var(${variableName})`;
    }
  }

  return {
    css,
    className,
    strings,
    values,
    variables,
  };
}

export function css(
  strings: TemplateStringsArray,
  ...values: (Selector | string)[]
): CssInfo {
  return cssInner("", "&", strings, ...values);
}

export function style(rules: (selector: Selector) => CssInfo): string {
  const context = getCurrentRendererScope().get(StylesContext);

  if (context == null) {
    throw new Error(
      "styled component has to be descendant of `StylesProvider`"
    );
  }

  return getCurrentRendererScope().memo(() => {
    const genericRulesInfo = rules(selectorSym);
    const hash = generateHash(genericRulesInfo.css);
    const rulesInfo = cssInner(
      context.prefix,
      hash,
      genericRulesInfo.strings,
      ...genericRulesInfo.values
    );
    let varsClassName = "";

    context.addStyle(hash, rulesInfo.css);

    if (rulesInfo.variables.length > 0) {
      varsClassName = `${rulesInfo.className}-vars`;
      context.addStyle(
        `${hash}-vars`,
        `.${varsClassName}{${rulesInfo.variables
          .map(([name, value]) => `${name}:${value};`)
          .join("")}}`
      );
    }

    return [rulesInfo.className, varsClassName].join(" ");
  })();
}
