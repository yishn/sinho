/* @jsx h */

import { h, DomRenderer } from "../../src/html/mod.ts";
import {
  Component,
  RendererScope,
  mount,
  When,
} from "../../src/renderer/mod.ts";

class App extends Component<void, DomRenderer> {
  render(s: RendererScope<DomRenderer>) {
    const [counter, setCounter] = s.signal(0);
    const illegal = s.memo(() => counter() < 0 || counter() > 10);

    return (
      <div class={() => "app"}>
        <h1>Hello World!</h1>

        <p
          style={{
            color: () => (illegal() ? "red" : undefined),
            fontWeight: () => (illegal() ? "bold" : undefined),
          }}
        >
          <button
            onClick={() => {
              setCounter((counter) => counter - 1);
            }}
          >
            -
          </button>

          <button
            onClick={() => {
              setCounter((counter) => counter + 1);
            }}
          >
            +
          </button>

          {" Counter: "}
          {counter}
          {() => (illegal() ? "⚠️" : "")}
        </p>

        <When
          condition={illegal}
          then={() => <h3>Counter must be between 0 and 10!</h3>}
          otherwise={() => <p>Everything ok!</p>}
        />
      </div>
    );
  }
}

mount(new DomRenderer(), new App(), document.getElementById("root")!);
