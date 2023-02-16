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
    const okParagraphRef = s.renderer.nodeRef<HTMLParagraphElement>(s);

    s.effect(() => {
      console.log(okParagraphRef());
      console.log(okParagraphRef() == null ? "Dismounted" : "Mounted");
    });

    return (
      <div class="app">
        <h1>Hello World!</h1>

        <p
          style={{
            color: () => (illegal() ? "red" : undefined),
            fontWeight: () => (illegal() ? "bold" : undefined),
          }}
        >
          <button onclick={() => setCounter((c) => c - 1)}>-</button>
          <button onclick={() => setCounter((c) => c + 1)}>+</button>
          {/* */} Counter: {counter}
          {() => (illegal() ? "⚠️" : "")}
        </p>

        <When
          condition={illegal}
          then={() => <h3>Counter must be between 0 and 10!</h3>}
          otherwise={() => (
            <p
              ref={okParagraphRef}
              style={{
                color: "green",
              }}
            >
              Everything ok!
            </p>
          )}
        />
      </div>
    );
  }
}

mount(new DomRenderer(), new App(), document.getElementById("root")!);
