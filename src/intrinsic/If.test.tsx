import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert";
import { If, useSignal, Else, ElseIf } from "../mod.js";
import { useScope } from "../scope.js";

beforeEach(() => {
  GlobalRegistrator.register();
});

afterEach(() => {
  GlobalRegistrator.unregister();
});

test("If", async () => {
  const s = useScope();
  const [show, setShow] = useSignal(true);
  const [failMessage, setFailMessage] = useSignal("Failure");
  const [obj, setObj] = useSignal<{ value: string }>();

  const el = (
    <div>
      <If condition={show}>
        <h1>Success!</h1>
      </If>
      <ElseIf condition={() => obj() != null}>
        <h1>{() => obj()!.value}</h1>
      </ElseIf>
      <Else>
        <h1>{failMessage}</h1>
      </Else>
    </div>
  ).build()[0];

  const effectsCount = s._effects.length;
  const subscopesCount = s._subscopes.length;

  assert.strictEqual(el.textContent, "Success!");

  setShow(false);
  assert.strictEqual(el.textContent, "Failure");
  const innerElement = el.childNodes[1];

  setFailMessage("Unknown Failure");
  assert.strictEqual(el.textContent, "Unknown Failure");
  assert.strictEqual(el.childNodes[1], innerElement);

  setObj({ value: "Object Success!" });
  assert.strictEqual(el.textContent, "Object Success!");

  setObj(undefined);
  assert.strictEqual(el.textContent, "Unknown Failure");

  setShow(true);
  assert.strictEqual(el.textContent, "Success!");

  assert.deepStrictEqual(
    [s._effects.length, s._subscopes.length],
    [effectsCount, subscopesCount],
    "Does not leak memory",
  );
});
