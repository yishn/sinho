import {
  Component,
  createContext,
  defineComponents,
  event,
  prop,
  Style,
  css,
  useContext,
} from "sinho";

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
}) {
  render() {
    const theme = useContext(ThemeContext);
    const dark = () => theme() === Theme.Dark;

    return (
      <>
        <button
          style={{
            "--border-color": () => (dark() ? "#777" : "#bbb"),
            "--background-color": () => (dark() ? "#555" : "#ddd"),
            "--color": () => (dark() ? "#fff" : "#333"),
            "--hover-background-color": () => (dark() ? "#666" : "#ccc"),
            "--active-background-color": () => (dark() ? "#444" : "#bbb"),
          }}
          type="button"
          onclick={this.events.onButtonClick}
        >
          <slot></slot>
        </button>

        <Style>{css`
          :host {
            display: inline-block;
          }

          button {
            border: 2px solid var(--border-color);
            background-color: var(--background-color);
            color: var(--color);
            padding: 0.2em 0.5em;
            transition:
              background-color 0.2s,
              color 0.2s,
              border-color 0.2s;
          }

          button:hover {
            background-color: var(--hover-background-color);
          }

          button:active {
            background-color: var(--active-background-color);
          }
        `}</Style>
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

        <Style>{css`
          :host {
            display: inline-block;
          }
        `}</Style>
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

        <Style>{css`
          :host {
            display: block;
          }
        `}</Style>

        <Style light>{css`
          body {
            background-color: ${() => (dark() ? "#333" : "#fff")};
            color: ${() => (dark() ? "#fff" : "#333")};
          }
        `}</Style>

        <Style light>{css`
          body {
            transition:
              background-color 0.2s,
              color 0.2s;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents(ThemedButton, ThemedCheckbox, App);
