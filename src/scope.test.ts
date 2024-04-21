import assert from "node:assert";
import { test } from "node:test";
import {
  useBatch,
  useEffect,
  useMemo,
  useSignal,
  useSubscope,
} from "./scope.js";

test("Nested effects and cleanups", () => {
  const logs: string[] = [];

  const [, destroy] = useSubscope(() => {
    const [greeting, setGreeting] = useSignal("Greetings!");
    const [firstName, setFirstName] = useSignal("Yichuan");
    const [lastName, setLastName] = useSignal("Shen");
    const fullName = useMemo(() => `${firstName()} ${lastName()}`);

    useEffect(() => {
      const [, destroy] = useSubscope(() => {
        useEffect(() => {
          logs.push(greeting());
        });
      });

      logs.push(`Hello World, ${fullName()}`);

      return () => {
        logs.push(`Bye, ${fullName()}!`);
        destroy();
      };
    });

    setGreeting("Hiya!");

    useBatch(() => {
      setFirstName("Daniel");
      setLastName("Neugber");
    });
  });

  destroy();

  assert.deepStrictEqual(logs, [
    "Greetings!",
    "Hello World, Yichuan Shen",
    "Hiya!",
    "Bye, Yichuan Shen!",
    "Hiya!",
    "Hello World, Daniel Neugber",
    "Bye, Daniel Neugber!",
  ]);
});

test("Manually track effect dependencies", () => {
  const logs: string[] = [];
  const [greeting, setGreeting] = useSignal("Hello, World!");

  const [, destroy] = useSubscope(() => {
    useEffect(() => {
      logs.push(greeting());
    }, [greeting]);

    setGreeting("Hiya!");
    setGreeting("Greetings!");

    assert.deepStrictEqual(logs, ["Hello, World!", "Hiya!", "Greetings!"]);
  });

  destroy();
  logs.length = 0;

  const [firstName, setFirstName] = useSignal("Yichuan");
  const [lastName, setLastName] = useSignal("Shen");
  const fullName = () => `${firstName()} ${lastName()}`;

  const [, destroy2] = useSubscope(() => {
    useEffect(() => {
      logs.push(greeting() + " " + fullName());
    }, [fullName]);

    assert.deepStrictEqual(logs, ["Greetings! Yichuan Shen"]);

    setGreeting("Good morning");
    assert.deepStrictEqual(logs, ["Greetings! Yichuan Shen"]);

    useBatch(() => {
      setFirstName("Daniel");
      setLastName("Neugber");
    });

    assert.deepStrictEqual(logs, [
      "Greetings! Yichuan Shen",
      "Good morning Daniel Neugber",
    ]);
  });

  destroy2();
});
