import assert from "node:assert";
import { performance } from "node:perf_hooks";
import { test } from "node:test";
import { ArrayMutation, useArrayMutation } from "./array_mutation.js";
import { useEffect, useSignal } from "./mod.js";

test("Basic usage of useArrayMutation", () => {
  const [array, setArray] = useSignal([
    {
      name: "Book 1",
      published: 1992,
    },
    {
      name: "Book 2",
      published: 1992,
    },
    {
      name: "Book 3",
      published: 2000,
    },
    {
      name: "Book 4",
      published: 2024,
    },
  ]);

  const mutationsLog: ArrayMutation[] = [];
  const mutationResult = useArrayMutation(array, (entry) => entry.name);

  useEffect(() => {
    mutationsLog.push(...mutationResult()._mutations);
  });

  assert.deepStrictEqual(mutationsLog, [
    {
      _type: "a",
      _index: 0,
      _key: "Book 1",
    },
    {
      _type: "a",
      _index: 1,
      _key: "Book 2",
    },
    {
      _type: "a",
      _index: 2,
      _key: "Book 3",
    },
    {
      _type: "a",
      _index: 3,
      _key: "Book 4",
    },
  ]);

  mutationsLog.length = 0;

  setArray([
    {
      name: "Book 3",
      published: 2000,
    },
    {
      name: "Book 6",
      published: 2025,
    },
    {
      name: "Book 1",
      published: 1992,
    },
    {
      name: "Book 5",
      published: 2024,
    },
  ]);

  assert.deepStrictEqual(mutationsLog, [
    { _type: "r", _key: "Book 2", _index: 1 },
    { _type: "r", _key: "Book 4", _index: 2 },
    { _type: "m", _key: "Book 3", _from: 1, _to: 0 },
    { _type: "a", _key: "Book 6", _index: 1 },
    { _type: "a", _key: "Book 5", _index: 3 },
  ]);

  mutationsLog.length = 0;

  setArray((arr) =>
    [...arr].sort((x, y) => (x.name < y.name ? -1 : +(x.name != y.name))),
  );

  assert.deepStrictEqual(mutationsLog, [
    { _type: "m", _key: "Book 1", _from: 2, _to: 0 },
    { _type: "m", _key: "Book 5", _from: 3, _to: 2 },
  ]);
});

test("Benchmark useArrayMutation for repeated list updates", () => {
  const size = 200;
  const iterations = 400;
  const base = Array.from({ length: size }, (_, i) => ({ id: i }));
  const [array, setArray] = useSignal(base);

  let totalMutations = 0;
  const mutationResult = useArrayMutation(array, (entry) => entry.id);

  useEffect(() => {
    totalMutations += mutationResult()._mutations.length;
  });

  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    const shift = i % size;

    setArray((arr) => {
      const next = arr.slice();
      const head = next.splice(0, shift);

      next.push(...head);
      return next;
    });
  }

  const durationMs = performance.now() - start;

  // Keep this as a benchmark smoke test: assert useful work happened.
  assert.ok(totalMutations > 0);

  console.info(
    `[benchmark] useArrayMutation: ${iterations} updates on ${size} items in ${durationMs.toFixed(2)}ms`,
  );
});
