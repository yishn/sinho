import { h, HtmlRenderer, text } from "../../src/html/mod.ts";
import { Component, RendererScope, Rendering } from "../../src/renderer/mod.ts";

class App extends Component<HtmlRenderer, void> {
  render(s: RendererScope<HtmlRenderer>): Rendering<HtmlRenderer> {
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
            //
            text(" Counter: "),
            text(counter),
            text(() => (illegal() ? "⚠️" : "")),
          )
      )
      .render(s);
  }
}

new HtmlRenderer().mount(new App(), document.getElementById("root")!);
