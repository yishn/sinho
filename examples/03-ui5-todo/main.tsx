import { Component } from "../../src/renderer/component.ts";
import { mount, RendererScope } from "../../src/renderer/renderer.ts";
import { sapRequire, Ui5Control, Control } from "../../src/ui5/mod.ts";
import { Ui5NodeType, Ui5Renderer } from "../../src/ui5/ui5_renderer.ts";

class App extends Component<{}, Ui5Renderer> {
  render(s: RendererScope<Ui5Renderer>): Component<any, Ui5Renderer> {
    throw new Error("Method not implemented.");
  }
}

async function main() {
  const [Panel, Text] = await sapRequire<
    new () => Ui5Control,
    new () => Ui5Control
  >("sap/m/Panel", "sap/m/Text");

  const panel = new Panel();
  const component = new Control({
    Control: Text,
    text: () => "Hello World",
  });

  const renderer = await Ui5Renderer.init();

  mount(renderer, component, { type: Ui5NodeType.Control, control: panel });

  panel.placeAt("root");
}

main().catch(console.error);
