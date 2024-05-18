import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert";
import { For, useSignal, useRef, If, ElseIf } from "../mod.js";
import { useScope } from "../scope.js";

beforeEach(() => {
  GlobalRegistrator.register();
});

afterEach(() => {
  GlobalRegistrator.unregister();
});

test("For", async () => {
  const s = useScope();
  const [list, setList] = useSignal<string[]>([]);
  const ulRef = useRef<HTMLUListElement>();

  document.body.append(
    ...(
      <ul ref={ulRef}>
        <For each={list} key={(item) => item}>
          {(item) => <li>{item}</li>}
        </For>
      </ul>
    ).build()(),
  );

  const effectsCount = s._effects.length;
  const subscopesCount = s._subscopes.length;

  assert.strictEqual(ulRef()!.children.length, 0);

  setList(["a", "b", "c"]);
  assert.strictEqual(ulRef()!.children.length, 3);
  const [a1, b1, c1] = ulRef()!.children;

  setList(["b", "c", "a"]);
  const [b2, c2, a2] = ulRef()!.children;
  assert.strictEqual(a1, a2);
  assert.strictEqual(b1, b2);
  assert.strictEqual(c1, c2);

  setList(["d", "a", "e", "b"]);
  assert.strictEqual(ulRef()!.children.length, 4);
  const [d3, a3, e3, b3] = ulRef()!.children;
  assert.strictEqual(a2, a3);
  assert.strictEqual(b2, b3);
  assert.notStrictEqual(d3, b2);
  assert.notStrictEqual(e3, a2);

  setList([]);
  assert.strictEqual(ulRef()!.children.length, 0);

  assert.deepStrictEqual(
    [s._effects.length, s._subscopes.length],
    [effectsCount, subscopesCount],
    "Does not leak memory",
  );
});

test("For in If", async () => {
  const s = useScope();
  const [condition, setCondition] = useSignal(false);
  const [list, setList] = useSignal<string[]>(["a"]);
  const ulRef = useRef<HTMLUListElement>();

  document.body.append(
    ...(
      <If condition={condition}>
        <ul ref={ulRef}>
          <For each={list} key={(item) => item}>
            {(item) => <li>{item}</li>}
          </For>
        </ul>
      </If>
    ).build()(),
  );

  const effectsCount = s._effects.length;
  const subscopesCount = s._subscopes.length;

  assert.strictEqual(ulRef(), undefined);

  setCondition(true);
  assert.notStrictEqual(ulRef(), undefined);
  assert.strictEqual(ulRef()!.children.length, 1);

  setList(["a", "b", "c"]);
  assert.strictEqual(ulRef()!.children.length, 3);

  setCondition(false);
  assert.strictEqual(ulRef(), undefined);

  assert.deepStrictEqual(
    [s._effects.length, s._subscopes.length],
    [effectsCount, subscopesCount],
    "Does not leak memory",
  );
});

test("Fragment and If in For", async () => {
  const s = useScope();
  const [list, setList] = useSignal<string[]>(["a", "b", "c"]);
  const ulRef = useRef<HTMLUListElement>();

  document.body.append(
    ...(
      <ul ref={ulRef}>
        <For each={list}>
          {(item) => (
            <>
              <If condition={() => item() === "b"}>
                <li>{item}</li>
              </If>
              <ElseIf condition={() => item() === "d"}>
                <li>special</li>
              </ElseIf>
            </>
          )}
        </For>
      </ul>
    ).build()(),
  );

  const effectsCount = s._effects.length;
  const subscopesCount = s._subscopes.length;

  assert.strictEqual(ulRef()!.children.length, 1);
  assert.strictEqual(ulRef()!.children[0].textContent, "b");

  setList(["a", "c"]);
  assert.strictEqual(ulRef()!.children.length, 0);

  setList(["b", "b", "b"]);
  assert.strictEqual(ulRef()!.children.length, 3);

  setList(["b", "b", "b", "d"]);
  assert.strictEqual(ulRef()!.children.length, 4);
  assert.strictEqual(ulRef()!.children[3].textContent, "special");

  assert.deepStrictEqual(
    [s._effects.length, s._subscopes.length],
    [effectsCount, subscopesCount],
    "Does not leak memory",
  );
});
