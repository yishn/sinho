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
