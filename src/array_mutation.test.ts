import assert from "node:assert";
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
    mutationsLog.push(...mutationResult().mutations);
  });

  assert.deepStrictEqual(mutationsLog, [
    {
      type: "add",
      index: 0,
      key: "Book 1",
    },
    {
      type: "add",
      index: 1,
      key: "Book 2",
    },
    {
      type: "add",
      index: 2,
      key: "Book 3",
    },
    {
      type: "add",
      index: 3,
      key: "Book 4",
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
    { type: "remove", key: "Book 2", index: 1 },
    { type: "remove", key: "Book 4", index: 2 },
    { type: "move", key: "Book 3", from: 1, to: 0 },
    { type: "add", key: "Book 6", index: 1 },
    { type: "add", key: "Book 5", index: 3 },
  ]);

  mutationsLog.length = 0;

  setArray((arr) =>
    [...arr].sort((x, y) => (x.name < y.name ? -1 : +(x.name != y.name))),
  );

  assert.deepStrictEqual(mutationsLog, [
    { type: "move", key: "Book 1", from: 2, to: 0 },
    { type: "move", key: "Book 5", from: 3, to: 2 },
  ]);
});
