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

  assertEquals(s.context(messageContext), "fallback");

  s.subscope(() => {
    s.context(messageContext, "hello world", () => {
      s.subscope(() => {
        assertEquals(s.context(messageContext), "hello world");
        assertEquals(s.context(boolContext), true);
      });
    });
  });

  s.context(boolContext, false, () => {
    s.context(messageContext, "goodbye", () => {
      const [count, _setCount] = s.signal(0);
      setCount = _setCount;

      s.subscope(() => {
        s.effect(() => {
          logs.push(
            `${count()} ${s.context(messageContext)} ${s.context(boolContext)}`
          );
        });

        s.subscope(() => {
          assertEquals(s.context(messageContext), "goodbye");
          assertEquals(s.context(boolContext), false);
        });
      });
    });
  });

  setCount!((count) => count + 1);
  setCount!((count) => count + 1);

  assertEquals(logs, ["0 goodbye false", "1 goodbye false", "2 goodbye false"]);
});
