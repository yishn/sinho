import { prepare } from "./test_utils/mock_dom.js";
import assert from "node:assert";
import { beforeEach, test } from "node:test";
import { Component, Template, prop, useRef, useSignal } from "./mod.js";

beforeEach(() => {
  prepare();
});

test("Component with reactive prop", () => {
  class Greeting extends Component({
    name: prop<string>("World"),
  }) {
    render(): Template {
      return <h1>Hello, {this.props.name}!</h1>;
    }
  }

  customElements.define("x-greeting", Greeting);

  const [name, setName] = useSignal("World");
  const ref = useRef<Greeting>();

  document.body.append(...(<Greeting ref={ref} name={name} />).build());

  const renderRoot = ref()!.shadowRoot!;
  const h1 = renderRoot.querySelector("h1")!;

  assert.strictEqual(h1.textContent, "Hello, World!");

  setName("John");
  assert.strictEqual(h1.textContent, "Hello, John!");
});
