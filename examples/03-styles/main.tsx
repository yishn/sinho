/** @jsx s.createComponent */

import { DomRenderer, createStyleContext } from "../../src/dom/mod.ts";
import { FunctionComponent, SignalLike, Children } from "../../src/mod.ts";

type ThemeMode = "light" | "dark";

const StyleContext = createStyleContext<{
  mode: SignalLike<ThemeMode>;
}>({
  mode: () => "light",
});

const Box = StyleContext.createStyledComponent<{
  class?: SignalLike<string | undefined>;
  children?: Children<DomRenderer>;
}>(
  (props, s) => (
    <div class={"box " + (s.get(props.class) ?? "")}>{props.children}</div>
  ),
  (context, namespace) => `
    .${namespace}.box {
      padding: 1em 2em;
      background: ${context.mode() === "dark" ? "#333" : "#eee"};
      color: ${context.mode() === "dark" ? "#eee" : "#333"};
      transition: background .2s;
    }
  `
);

const Button = StyleContext.createStyledComponent<
  JSX.IntrinsicElements["button"]
>(
  (props, s) => (
    <button {...props} class={() => "button " + (s.get(props.class) ?? "")} />
  ),
  (context, namespace) => `
    .${namespace}.button {
      padding: .2em .5em;
      background: ${context.mode() === "dark" ? "#555" : "#ccc"};
      color: ${context.mode() === "dark" ? "#eee" : "#333"};
      transition: background .2s;
    }
  `
);

const App: FunctionComponent<{}, DomRenderer> = (_, s) => {
  const [themeMode, setThemeMode] = s.signal<ThemeMode>("light");

  return (
    <StyleContext.Provider value={{ mode: themeMode }}>
      <div class="app">
        <Box>
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
        </Box>
      </div>
    </StyleContext.Provider>
  );
};

new DomRenderer().mount(App, document.getElementById("root")!);
