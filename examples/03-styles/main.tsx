/** @jsx s.createComponent */

import { DomRenderer, StylesProvider, css } from "../../src/dom/mod.ts";
import {
  FunctionComponent,
  SignalLike,
  Children,
  createContext,
} from "../../src/mod.ts";

type ThemeMode = "light" | "dark";

const StyleContext = createContext<{
  mode: SignalLike<ThemeMode>;
}>({
  mode: () => "light",
});

const Box: FunctionComponent<
  { children?: Children<DomRenderer> },
  DomRenderer
> = (props, s) => (
  <div
    class={() =>
      "box " +
      css(s, (x) => {
        const mode = s.get(StyleContext).mode();

        return `
          ${x} {
            padding: 1em 2em;
            background: ${mode === "dark" ? "#333" : "#eee"};
            color: ${mode === "dark" ? "#eee" : "#333"};
            transition: background .2s;
          }`;
      })
    }
  >
    {props.children}
  </div>
);

const Button: FunctionComponent<
  JSX.IntrinsicElements["button"],
  DomRenderer
> = (props, s) => (
  <button
    {...props}
    class={() =>
      "button " +
      css(s, (x) => {
        const mode = s.get(StyleContext).mode();

        return `
          ${x} {
            padding: .2em .5em;
            background: ${mode === "dark" ? "#555" : "#ccc"};
            color: ${mode === "dark" ? "#eee" : "#333"};
            transition: background .2s;
          }

          ${x}:hover, ${x}:focus {
            background: ${mode === "dark" ? "#777" : "#bbb"}
          }`;
      })
    }
  />
);

const App: FunctionComponent<{}, DomRenderer> = (_, s) => {
  const [themeMode, setThemeMode] = s.signal<ThemeMode>("light");

  return (
    <StylesProvider>
      <StyleContext.Provider value={{ mode: themeMode }}>
        <div class="app">
          <Box>
            <h1>Styles Demo</h1>

            <p>
              <Button
                onclick={(evt) => {
                  evt.preventDefault();
                  setThemeMode("dark");
                }}
              >
                Dark Mode
              </Button>{" "}
              <Button
                onclick={(evt) => {
                  evt.preventDefault();
                  setThemeMode("light");
                }}
              >
                Light Mode
              </Button>
            </p>
          </Box>
        </div>
      </StyleContext.Provider>
    </StylesProvider>
  );
};

new DomRenderer().mount(App, document.getElementById("root")!);
