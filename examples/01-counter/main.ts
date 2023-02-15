import { h, DomRenderer, text } from "../../src/html/mod.ts";
import {
  Component,
  Switch,
  RendererScope,
} from "../../src/renderer/mod.ts";

class App extends Component<void, DomRenderer> {
  render(s: RendererScope<DomRenderer>) {
    const [counter, setCounter] = s.signal(0);
    const illegal = s.memo(() => counter() < 0 || counter() > 10);

    return h("div")
      .attrs({
        class: () => "app",
      })
      .children(
        h("h1").children(text("Hello World!")),

        h("p")
          .style({
            color: () => (illegal() ? "red" : undefined),
            fontWeight: () => (illegal() ? "bold" : undefined),
          })
          .children(
            h("button")
              .on("click", () => {
                setCounter((counter) => counter - 1);
              })
              .children(text("-")),
            text(" "),
            h("button")
              .on("click", () => {
                setCounter((counter) => counter + 1);
              })
              .children(text("+")),

            text(" Counter: "),
            text(counter),
            text(() => (illegal() ? "⚠️" : ""))
          ),

        new Switch()
          .when(illegal, () =>
            h("h3").children(text("Counter must be between 0 and 10!"))
          )
          .otherwise(() => h("p").children(text("Everything ok!")))
      );
  }
}

new DomRenderer().mount(new App(), document.getElementById("root")!);
