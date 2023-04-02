/** @jsx h */

import hash from "https://cdn.skypack.dev/@emotion/hash/dist/emotion-hash.esm.js";
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

const StylesContext = createContext<{
  classPrefix: string;
  addStyle: (hash: string, rules: string) => void;
}>();

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
          classPrefix: this.props.classPrefix ?? "css-",
          addStyle(hash, rules) {
            setStylesState(
              (stylesState) => {
                if (!stylesState.hashs.has(hash)) {
                  stylesState.hashs.set(hash, stylesState.styles.length);
                  stylesState.styles.push({ hash, rules });
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

export function style(rules: (selector: string) => string): string {
  const context = getCurrentRendererScope().get(StylesContext);

  if (context == null) {
    throw new Error(
      "styled component has to be descendant of `StylesProvider`"
    );
  }

  return getCurrentRendererScope().memo(() => {
    const _hash = hash(rules("&"));
    const cssName = context.classPrefix + _hash;
    const _rules = rules(`.${cssName}`);

    context.addStyle(_hash, _rules);

    return cssName + " ";
  })();
}
