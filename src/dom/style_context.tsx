/** @jsx s.createComponent */

import hash from "https://cdn.skypack.dev/@emotion/hash/dist/emotion-hash.esm.js";
import {
  Children,
  Component,
  For,
  Fragment,
  RendererScope,
  createContext,
} from "../mod.ts";
import { DomRenderer } from "./mod.ts";
import { Rendering } from "../renderer/rendering.ts";

const StylesContext = createContext<{
  addStyle: (hash: string, rules: string) => void;
}>();

export interface StylesProviderProps {
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

export function css(
  s: RendererScope<DomRenderer>,
  rules: (selector: string) => string
): string {
  const context = s.get(StylesContext);

  if (context == null) {
    throw new Error(
      "styled component has to be descendant of `StylesProvider`"
    );
  }

  return s.memo(() => {
    const _hash = hash(rules("&"));
    const cssName = `css-${_hash}`;
    const _rules = rules(`.${cssName}`);

    context.addStyle(_hash, _rules);

    return cssName + " ";
  })();
}
