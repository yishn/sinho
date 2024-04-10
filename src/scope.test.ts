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

test("Error handling", async () => {
  const logs: string[] = [];
  const onError = (err: unknown) => {
    logs.push((err as Error).message);
  };

  useSubscope(
    () => {
      useSubscope(() => {
        throw new Error("Subscope run error");
      });

      assert.throws(() =>
        useSubscope(
          () => {
            throw new Error("Actually throws");
          },
          {
            onError: (err) => {
              throw err;
            },
          },
        ),
      );

      throw new Error("Will throw again");
    },
    { onError },
  );

  const [value, setValue] = useSignal(0);

  useSubscope(
    () => {
      useEffect(() => {
        if (value() == 0) {
          throw new Error("Effect error");
        } else {
          throw new Error("Effect rerun error");
        }
      });
    },
    { onError },
  );

  await new Promise((resolve) => setTimeout(resolve, 1));
  setValue((n) => n + 1);

  assert.deepStrictEqual(logs, [
    "Subscope run error",
    "Will throw again",
    "Effect error",
    "Effect rerun error",
  ]);
});
