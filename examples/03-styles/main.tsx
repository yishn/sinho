/** @jsx h */

import { DomRenderer, StylesProvider, Style, css } from "../../src/dom/mod.ts";
import {
  h,
  FunctionComponent,
  SignalLike,
  createContext,
} from "../../src/mod.ts";

type ThemeMode = "light" | "dark";

const StyleContext = createContext<{
  mode: SignalLike<ThemeMode>;
}>({
  mode: () => "light",
});

const Box: FunctionComponent<JSX.IntrinsicElements["div"], DomRenderer> = (
  props,
  s
) => {
  const styleContext = s.get(StyleContext);
  const ref = props.ref ?? s.nodeRef<HTMLDivElement>();

  return (
    <div {...props} ref={ref} class={() => "box " + s.get(props.class ?? "")}>
      {props.children}

      <Style targetRef={ref}>
        {(x) => css`
          ${x} {
            padding: 1em 2em;
            background: ${styleContext.mode() === "dark" ? "#333" : "#eee"};
            color: ${styleContext.mode() === "dark" ? "#eee" : "#333"};
            transition: background 0.2s;
          }
        `}
      </Style>
    </div>
  );
};

const Button: FunctionComponent<
  JSX.IntrinsicElements["button"],
  DomRenderer
> = (props, s) => {
  const styleContext = s.get(StyleContext);
  const ref = props.ref ?? s.nodeRef<HTMLButtonElement>();

  return (
    <button
      {...props}
      ref={ref}
      class={() => "button " + s.get(props.class ?? "")}
    >
      {props.children}

      <Style targetRef={ref}>
        {(x) => css`
          ${x} {
            padding: 0.2em 0.5em;
            background: ${styleContext.mode() === "dark" ? "#555" : "#ccc"};
            color: ${styleContext.mode() === "dark" ? "#eee" : "#333"};
            transition: background 0.2s;
          }

          ${x}:hover, ${x}:focus {
            background: ${styleContext.mode() === "dark" ? "#777" : "#bbb"};
          }
        `}
      </Style>
    </button>
  );
};

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
                class="dark"
                onclick={(evt) => {
                  evt.preventDefault();
                  setThemeMode("dark");
                }}
              >
                Dark Mode
              </Button>{" "}
              <Button
                class="light"
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
