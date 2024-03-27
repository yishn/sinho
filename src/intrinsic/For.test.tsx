import { beforeEach, test } from "node:test";
import assert from "node:assert";
import { For, useScope, useSignal, useRef } from "../mod.js";
import { prepare } from "../_test_utils/mock_dom.js";

beforeEach(() => {
  prepare();
});

test("For", async () => {
  const s = useScope();
  const [list, setList] = useSignal<string[]>([]);
  const ulRef = useRef<HTMLUListElement>();

  document.body.append(
    ...(
      <ul ref={ulRef}>
        <For
          each={list}
          key={(item) => item}
          render={(item) => <li>{item}</li>}
        />
      </ul>
    ).build(),
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
