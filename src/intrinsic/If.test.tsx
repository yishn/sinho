import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert";
import { If, useSignal, Else, ElseIf, TemplateNodes } from "../mod.js";
import { useRef, useScope } from "../scope.js";

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
  const elRef = useRef<HTMLDivElement>();

  TemplateNodes.forEach(
    (
      <div ref={elRef}>
        <If condition={show}>
          <h1>Success!</h1>
        </If>
        <ElseIf condition={() => obj() != null}>
          <h1>{() => obj()?.value}</h1>
        </ElseIf>
        <Else>
          <h1>{failMessage}</h1>
        </Else>
      </div>
    ).build(),
    (node) => document.body.append(node),
  );

  const effectsCount = s._effects.length;
  const subscopesCount = s._subscopes.length;

  assert.strictEqual(elRef()!.textContent, "Success!");

  setShow(false);
  assert.strictEqual(elRef()!.textContent, "Failure");
  const innerElement = elRef()!.childNodes[1];

  setFailMessage("Unknown Failure");
  assert.strictEqual(elRef()!.textContent, "Unknown Failure");
  assert.strictEqual(elRef()!.childNodes[1], innerElement);

  setObj({ value: "Object Success!" });
  assert.strictEqual(elRef()!.textContent, "Object Success!");

  setObj(undefined);
  assert.strictEqual(elRef()!.textContent, "Unknown Failure");

  setShow(true);
  assert.strictEqual(elRef()!.textContent, "Success!");

  assert.deepStrictEqual(
    [s._effects.length, s._subscopes.length],
    [effectsCount, subscopesCount],
    "Does not leak memory",
  );
});
