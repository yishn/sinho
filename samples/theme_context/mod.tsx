import {
  Component,
  Template,
  createContext,
  defineComponents,
  event,
  prop,
} from "shingo";

enum Theme {
  Light,
  Dark,
}

const ThemeContext = createContext<Theme>(Theme.Light);

class ThemedButton extends Component({
  theme: prop(ThemeContext),
  onButtonClick: event(() => MouseEvent),
  children: true,
}) {
  static tagName = "themed-button";

  render(): Template {
    const dark = () => this.props.theme() === Theme.Dark;

    return (
      <>
        <button type="button" onclick={this.events.onButtonClick}>
          <slot></slot>
        </button>

        <style>
          {() => `
            :host {
              display: inline-block;
            }

            button {
              border: 2px solid ${dark() ? "#777" : "#bbb"};
              background-color: ${dark() ? "#555" : "#ddd"};
              color: ${dark() ? "#fff" : "#333"};
              padding: .2em .5em;
              transition: background-color .2s, color .2s, border-color .2s;
            }

            button:hover {
              background-color: ${dark() ? "#666" : "#ccc"};
            }

            button:active {
              background-color: ${dark() ? "#444" : "#bbb"};
            }
          `}
        </style>
      </>
    );
  }
}

class ThemedCheckbox extends Component({
  theme: prop(ThemeContext),
  checked: prop<boolean>(false, {
    attribute: (value) => value != null,
  }),
  onCheckedChange: event(),
  children: true,
}) {
  static tagName = "themed-checkbox";

  render(): Template {
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

        <style>{`
          :host {
            display: inline-block;
          }
        `}</style>
      </>
    );
  }
}

class App extends Component({
  theme: prop(ThemeContext, {
    attribute: (value) => (value == "dark" ? Theme.Dark : Theme.Light),
  }),
}) {
  static tagName = "app-component";

  render(): Template {
    const dark = () => this.props.theme() === Theme.Dark;

    return (
      <>
        <p>
          <ThemedCheckbox
            checked={dark}
            onCheckedChange={() => {
              this.props.theme.set((theme) =>
                theme === Theme.Dark ? Theme.Light : Theme.Dark,
              );
            }}
          >
            Dark Mode
          </ThemedCheckbox>
        </p>

        <p>
          <ThemedButton>OK</ThemedButton> <ThemedButton>Cancel</ThemedButton>
        </p>

        <style>
          {() => `
            :host {
              display: block;
              padding: 1em;
              background-color: ${dark() ? "#333" : "#fff"};
              color: ${dark() ? "#fff" : "#333"};
              transition: background-color .2s, color .2s;
            }
          `}
        </style>
      </>
    );
  }
}

defineComponents(ThemedButton, ThemedCheckbox, App);
