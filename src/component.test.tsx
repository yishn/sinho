import { GlobalRegistrator } from "@happy-dom/global-registrator";
import assert from "node:assert";
import { afterEach, beforeEach, test } from "node:test";
import {
  Component,
  If,
  Template,
  TemplateNodes,
  defineComponents,
  event,
  prop,
  useRef,
  useSignal,
} from "./mod.js";

beforeEach(() => {
  GlobalRegistrator.register();
});

afterEach(() => {
  GlobalRegistrator.unregister();
});

test("Component with reactive prop", () => {
  class Greeting extends Component("x-greeting", {
    name: prop<string>("World"),
  }) {
    render(): Template {
      return <h1>Hello, {this.props.name}!</h1>;
    }
  }

  defineComponents(Greeting);

  const [name, setName] = useSignal("World");
  const ref = useRef<Greeting>();

  TemplateNodes.forEach((<Greeting ref={ref} name={name} />).build(), (node) =>
    document.body.append(node),
  );

  const renderRoot = ref()!.shadowRoot!;
  const h1 = renderRoot.querySelector("h1")!;

  assert.strictEqual(h1.textContent, "Hello, World!");

  setName("John");
  assert.strictEqual(h1.textContent, "Hello, John!");
});

test("Component with attributes", () => {
  class Greeting extends Component("x-greeting", {
    name: prop<string>("World", {
      attribute: String,
    }),
    age: prop<number | null>(null, {
      attribute: {
        transform: (value) => (value == null ? null : Number(value)),
      },
    }),
  }) {
    render(): Template {
      return (
        <>
          <h1>Hello, {this.props.name}!</h1>
          <If condition={() => this.props.age() != null}>
            <h2>You are {this.props.age} years old</h2>
          </If>
        </>
      );
    }
  }

  defineComponents(Greeting);

  const ref = useRef<Greeting>();
  TemplateNodes.forEach((<Greeting ref={ref} />).build(), (node) =>
    document.body.append(node),
  );

  const renderRoot = ref()!.shadowRoot!;
  const h1 = renderRoot.querySelector("h1")!;
  let h2 = renderRoot.querySelector("h2");

  assert.strictEqual(h1.textContent, "Hello, World!");
  assert.strictEqual(h2, null);

  ref()?.setAttribute("name", "John");
  h2 = renderRoot.querySelector("h2");
  assert.strictEqual(h1.textContent, "Hello, John!");
  assert.strictEqual(h2, null);

  ref()?.setAttribute("age", "25");
  h2 = renderRoot.querySelector("h2");
  assert.strictEqual(h2?.textContent, "You are 25 years old");

  ref()?.removeAttribute("name");
  assert.strictEqual(h1.textContent, "Hello, World!");
});

test("Component with events", () => {
  class Button extends Component("x-button", {
    text: prop<string>(),
    onButtonClick: event(MouseEvent),
  }) {
    render(): Template {
      return (
        <button onclick={this.events.onButtonClick}>{this.props.text}</button>
      );
    }

    click = (): void => {
      this.shadowRoot!.querySelector("button")!.click();
    };
  }

  defineComponents(Button);

  const ref = useRef<Button>();
  let clicked: boolean = false;

  TemplateNodes.forEach(
    (
      <Button
        ref={ref}
        text="Click me"
        onButtonClick={(evt) => {
          evt.preventDefault();
          clicked = true;
        }}
      />
    ).build(),
    (node) => document.body.append(node),
  );

  ref()?.click();
  assert.strictEqual(clicked, true);
});
