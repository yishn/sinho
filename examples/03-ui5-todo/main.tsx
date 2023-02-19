/** @jsx h */
/** @jsxFrag Fragment */

import {
  mount,
  RendererScope,
  Component,
  Fragment,
  OptionalSignal,
} from "../../src/mod.ts";
import {
  h,
  sapRequireControl,
  Control,
  Ui5Renderer,
} from "../../src/ui5/mod.ts";

const Title = Control.fromUi5Control<{
  text?: OptionalSignal<string>;
  titleStyle?: OptionalSignal<string>;
  width?: OptionalSignal<string>;
}>("sap/m/Title");

const Text = Control.fromUi5Control<{
  text?: OptionalSignal<string>;
}>("sap/m/Text");

class App extends Component<{}, Ui5Renderer> {
  render(s: RendererScope<Ui5Renderer>): Component<any, Ui5Renderer> {
    const [counter, setCounter] = s.signal(0);

    s.onMount(() => {
      const interval = setInterval(() => setCounter((x) => x + 1), 1000);

      s.cleanup(() => clearInterval(interval));
    });

    return (
      <>
        <Title text="Hello World!" titleStyle="H1" width="100%" />
        <Text text={() => `Counting ${counter()}...`} />
      </>
    );
  }
}

const panel = sapRequireControl("sap/m/Panel").then((Panel) =>
  new Panel().placeAt("root")
);
const renderer = new Ui5Renderer();

mount(renderer, <App />, renderer.createNode(panel));
