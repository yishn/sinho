import { h, HtmlRenderer } from "../../src/html/mod.ts";
import {
  Component,
  Conditional,
  Renderer,
  RendererScope,
  Rendering,
  text,
} from "../../src/renderer/mod.ts";

class App extends Component<void> {
  render<R extends Renderer>(s: RendererScope<R>): Rendering<R> {
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

        Conditional()
          .when(illegal, () =>
            h("h3").children(text("Counter must be between 0 and 10!"))
          )
          .otherwise(() => h("p").children(text("Everything ok!")))
      )
      .render(s);
  }
}

new HtmlRenderer().mount(new App(), document.getElementById("root")!);
