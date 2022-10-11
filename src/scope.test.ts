import { assertEquals } from "https://deno.land/std@0.159.0/testing/asserts.ts";
import { Scope } from "./scope.ts";

Deno.test("Scope test", () => {
  const s = new Scope();
  const logs: string[] = [];

  const [greeting, setGreeting] = s.signal("Greetigns!");
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
    "Greetigns!",
    "Hello World, Yichuan Shen",
    "Hiya!",
    "Bye, Yichuan Shen!",
    "Hiya!",
    "Hello World, Daniel Neugber",
  ]);
});
