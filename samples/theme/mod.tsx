import {
  Component,
  createContext,
  defineComponents,
  event,
  prop,
  Style,
  css,
  useContext,
  useMountEffect,
  Portal,
} from "shingo";

enum Theme {
  Light,
  Dark,
}

const ThemeContext = createContext<Theme>(Theme.Light);

const themeProps = {
  theme: prop(ThemeContext, {
    attribute: (value) => (value == "dark" ? Theme.Dark : Theme.Light),
  }),
};

class ThemedButton extends Component("themed-button", {
  ...themeProps,
  onButtonClick: event(MouseEvent),
  children: true,
}) {
  render() {
    const theme = useContext(ThemeContext);
    const dark = () => theme() === Theme.Dark;

    return (
      <>
        <button type="button" onclick={this.events.onButtonClick}>
          <slot></slot>
        </button>

        <Style
          css={css`
            :host {
              display: inline-block;
            }

            button {
              border: 2px solid ${() => (dark() ? "#777" : "#bbb")};
              background-color: ${() => (dark() ? "#555" : "#ddd")};
              color: ${() => (dark() ? "#fff" : "#333")};
              padding: 0.2em 0.5em;
              transition:
                background-color 0.2s,
                color 0.2s,
                border-color 0.2s;
            }

            button:hover {
              background-color: ${() => (dark() ? "#666" : "#ccc")};
            }

            button:active {
              background-color: ${() => (dark() ? "#444" : "#bbb")};
            }
          `}
        />
      </>
    );
  }
}

class ThemedCheckbox extends Component("themed-checkbox", {
  ...themeProps,
  checked: prop<boolean>(false, {
    attribute: (value) => value != null,
  }),
  onCheckedChange: event(),
  children: true,
}) {
  render() {
    return (
      <>
        <label>
          <input
            type="checkbox"
            checked={this.props.checked}
            onchange={this.events.onCheckedChange}
          />{" "}
          <slot></slot>
        </label>

        <Style
          css={css`
            :host {
              display: inline-block;
            }
          `}
        />
      </>
    );
  }
}

class App extends Component("app-component", {
  ...themeProps,
}) {
  render() {
    const theme = useContext(ThemeContext);
    const dark = () => theme() === Theme.Dark;

    return (
      <>
        <p>
          <ThemedCheckbox
            checked={dark}
            onCheckedChange={() => {
              this.theme = dark() ? Theme.Light : Theme.Dark;
            }}
          >
            Dark Mode
          </ThemedCheckbox>
        </p>

        <p>
          <ThemedButton>OK</ThemedButton> <ThemedButton>Cancel</ThemedButton>
        </p>

        <Style
          css={css`
            :host {
              display: block;
            }
          `}
        />

        <Portal mount={document.body}>
          <Style
            css={css`
              body {
                background-color: ${() => (dark() ? "#333" : "#fff")};
                color: ${() => (dark() ? "#fff" : "#333")};
                transition:
                  background-color 0.2s,
                  color 0.2s;
              }
            `}
          />
        </Portal>
      </>
    );
  }
}

defineComponents(ThemedButton, ThemedCheckbox, App);
