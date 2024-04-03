import { Component, ErrorBoundary, defineComponents } from "shingo";

class ThrowErrorButton extends Component({
  children: true,
}) {
  static tagName = "throw-error-button";

  render() {
    return (
      <button
        onclick={() => {
          throw new Error("This is a random error " + Math.random());
        }}
      >
        <slot />
      </button>
    );
  }
}

class App extends Component() {
  static tagName = "app-component";

  render() {
    return (
      <ErrorBoundary
        fallback={(props) => (
          <>
            <h2>Caught Error:</h2>
            <pre>{(props.error as Error).message}</pre>
            <p>
              <button onclick={props.reset}>Reset</button>{" "}
              <ThrowErrorButton>Throw Error Again!</ThrowErrorButton>
            </p>
          </>
        )}
      >
        <h1>Error Demo</h1>

        <p>
          <ThrowErrorButton>Throw Error</ThrowErrorButton>
        </p>
      </ErrorBoundary>
    );
  }
}

defineComponents(ThrowErrorButton, App);
