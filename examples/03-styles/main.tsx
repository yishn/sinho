/** @jsx s.createComponent */

import { DomRenderer, createStyleContext } from "../../src/dom/mod.ts";
import { FunctionComponent, SignalLike, Children } from "../../src/mod.ts";

type ThemeMode = "light" | "dark";

const StyleContext = createStyleContext<SignalLike<ThemeMode>>(() => "light");

const Page = StyleContext.createStyledComponent<{
  children?: Children<DomRenderer>;
}>(
  (props, s) => <div class="page">{props.children}</div>,
  (mode) => `
    .page {
      padding: 1em 2em;
      background: ${mode() === "dark" ? "#333" : "#eee"};
      color: ${mode() === "dark" ? "#eee" : "#333"};
      transition: background .2s;
    }
  `
);

const Button = StyleContext.createStyledComponent<
  JSX.IntrinsicElements["button"]
>(
  (props, s) => <button class="button" {...props} />,
  (mode) => `
    .button {
      padding: .2em .5em;
      background: ${mode() === "dark" ? "#555" : "#ccc"};
      color: ${mode() === "dark" ? "#eee" : "#333"};
      transition: background .2s;
    }
  `
);

const App: FunctionComponent<{}, DomRenderer> = (_, s) => {
  const [themeMode, setThemeMode] = s.signal<ThemeMode>("light");

  return (
    <StyleContext.Provider value={themeMode}>
      <div class="app">
        <Page>
          <h1>Styles Demo</h1>

          <p>
            <Button
              onclick={(evt) => {
                evt.preventDefault();

                setThemeMode((mode) => (mode === "light" ? "dark" : "light"));
              }}
            >
              Toggle Dark Mode
            </Button>
          </p>
        </Page>
      </div>
    </StyleContext.Provider>
  );
};

new DomRenderer().mount(App, document.getElementById("root")!);
