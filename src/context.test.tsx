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

class ContextConsumer extends Component(
  "context-consumer",
  { greeting: prop(GreetingContext) },
  { shadow: false },
) {
  render(): Template {
    const greeting = useContext(GreetingContext);

    return <>{greeting}</>;
  }
}

class MiddleComponent extends Component("x-middle") {
  contextConsumer = useRef<ContextConsumer>();

  render(): Template {
    return <ContextConsumer ref={this.contextConsumer} />;
  }
}

class ContextProvider extends Component("context-provider", {
  greeting: prop(GreetingContext, { attribute: String }),
}) {
  contextConsumer1 = useRef<ContextConsumer>();
  contextConsumer2 = useRef<ContextConsumer>();

  render(): Template {
    const middleComponentRef = useRef<MiddleComponent>();

    useEffect(() => {
      this.contextConsumer1.set(middleComponentRef()?.contextConsumer());
    });

    return (
      <>
        <MiddleComponent ref={middleComponentRef} />
        <ContextConsumer ref={this.contextConsumer2} />
      </>
    );
  }
}

defineComponents(ContextConsumer, MiddleComponent, ContextProvider);

const contextProvider = new ContextProvider();
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
  contextProvider.contextConsumer1()!.greeting = "Hi";

  assert.strictEqual(contextProvider.contextConsumer1()!.textContent, "Hi");
  assert.strictEqual(
    contextProvider.contextConsumer2()!.textContent,
    "Goodbye",
  );

  contextProvider.greeting = "Farewell";

  assert.strictEqual(contextProvider.contextConsumer1()!.textContent, "Hi");
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
