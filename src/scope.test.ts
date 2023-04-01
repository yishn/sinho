import { assertEquals } from "https://deno.land/std@0.159.0/testing/asserts.ts";
import { Scope, SignalSetter } from "./scope.ts";

Deno.test("Basic scope and effect test", () => {
  const s = new Scope();
  const logs: string[] = [];

  const [greeting, setGreeting] = s.signal("Greetings!");
  const [firstName, setFirstName] = s.signal("Yichuan");
  const [lastName, setLastName] = s.signal("Shen");
  const fullName = s.memo(() => `${firstName()} ${lastName()}`);

  s.effect(() => {
    s.effect(() => {
      logs.push(greeting());
    });

    logs.push(`Hello World, ${fullName()}`);

    s.cleanup(() => logs.push(`Bye, ${fullName()}!`));
  });

  setGreeting("Hiya!");

  s.batch(() => {
    setFirstName("Daniel");
    setLastName("Neugber");
  });

  assertEquals(logs, [
    "Greetings!",
    "Hello World, Yichuan Shen",
    "Hiya!",
    "Bye, Yichuan Shen!",
    "Hiya!",
    "Hello World, Daniel Neugber",
  ]);
});

Deno.test("Context test", () => {
  const messageContext = Scope.context("fallback");
  const boolContext = Scope.context(true);

  const s = new Scope();
  const logs: string[] = [];

  let setCount: SignalSetter<number>;

  assertEquals(s.get(messageContext), "fallback");

  s.subscope(() => {
    messageContext.provide(s, "hello world", () => {
      s.subscope(() => {
        assertEquals(s.get(messageContext), "hello world");
        assertEquals(s.get(boolContext), true);
      });
    });
  });

  boolContext.provide(s, false, () => {
    messageContext.provide(s, "goodbye", () => {
      const [count, _setCount] = s.signal(0);
      setCount = _setCount;

      s.subscope(() => {
        s.effect(() => {
          logs.push(
            `${count()} ${s.get(messageContext)} ${s.get(boolContext)}`
          );
        });

        s.subscope(() => {
          assertEquals(s.get(messageContext), "goodbye");
          assertEquals(s.get(boolContext), false);
        });
      });
    });
  });

  setCount!((count) => count + 1);
  setCount!((count) => count + 1);

  assertEquals(logs, ["0 goodbye false", "1 goodbye false", "2 goodbye false"]);
});
