import { GlobalRegistrator } from "@happy-dom/global-registrator";
import assert from "node:assert";
import { test } from "node:test";
import {
  Component,
  Template,
  createContext,
  defineComponents,
  prop,
  useContext,
  useEffect,
  useRef,
} from "./mod.js";

GlobalRegistrator.register();

const GreetingContext = createContext("Hello");

class ContextConsumingComponent extends Component(
  { greeting: prop(GreetingContext) },
  { shadow: false },
) {
  render(): Template {
    const greeting = useContext(GreetingContext);

    return <>{greeting}</>;
  }
}

class MiddleComponent extends Component() {
  contextConsumer = useRef<ContextConsumingComponent>();

  render(): Template {
    return <ContextConsumingComponent ref={this.contextConsumer} />;
  }
}

class ContextProvidingComponent extends Component({
  greeting: prop(GreetingContext, { attribute: true }),
}) {
  contextConsumer1 = useRef<ContextConsumingComponent>();
  contextConsumer2 = useRef<ContextConsumingComponent>();

  render(): Template {
    const middleComponentRef = useRef<MiddleComponent>();

    useEffect(() => {
      this.contextConsumer1.set(middleComponentRef()?.contextConsumer());
    });

    return (
      <>
        <MiddleComponent ref={middleComponentRef} />
        <ContextConsumingComponent ref={this.contextConsumer2} />
      </>
    );
  }
}

defineComponents(
  ContextConsumingComponent,
  MiddleComponent,
  ContextProvidingComponent,
);

const contextProvider = new ContextProvidingComponent();
document.body.append(contextProvider);

test("Context should be propagated deeply", () => {
  assert.strictEqual(contextProvider.contextConsumer1()!.textContent, "Hello");
  assert.strictEqual(contextProvider.contextConsumer2()!.textContent, "Hello");

  contextProvider.greeting = "Goodbye";

  assert.strictEqual(
    contextProvider.contextConsumer1()!.textContent,
    "Goodbye",
  );
  assert.strictEqual(
    contextProvider.contextConsumer2()!.textContent,
    "Goodbye",
  );
});

test("Context can be overridden locally", () => {
  contextProvider.contextConsumer1()!.greeting = "Hello";

  assert.strictEqual(contextProvider.contextConsumer1()!.textContent, "Hello");
  assert.strictEqual(
    contextProvider.contextConsumer2()!.textContent,
    "Goodbye",
  );

  contextProvider.greeting = "Farewell";

  assert.strictEqual(contextProvider.contextConsumer1()!.textContent, "Hello");
  assert.strictEqual(
    contextProvider.contextConsumer2()!.textContent,
    "Farewell",
  );

  contextProvider.contextConsumer1()!.greeting = undefined;

  assert.strictEqual(
    contextProvider.contextConsumer1()!.textContent,
    "Farewell",
  );
  assert.strictEqual(
    contextProvider.contextConsumer2()!.textContent,
    "Farewell",
  );
});
