/* @jsx s.createComponent */

import { DomRenderer } from "../../src/dom/mod.ts";
import { When, FunctionComponent } from "../../src/mod.ts";

const App: FunctionComponent<{}, DomRenderer> = (_, s) => {
  const [counter, setCounter] = s.signal(0);
  const illegal = s.memo(() => counter() < 0 || counter() > 10);
  const okParagraphRef = s.renderer.nodeRef<HTMLParagraphElement>(s);

  s.onMount(() => {
    console.log("App mounted");

    s.effect(() => {
      console.log(okParagraphRef());
      console.log(
        okParagraphRef() == null ? "Paragraph dismounted" : "Paragraph mounted"
      );
    });
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
};

new DomRenderer().mount(App, document.getElementById("root")!);
