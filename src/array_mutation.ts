import { Signal, SignalLike, useEffect, useSignal } from "./scope.js";

const getIndexMap = <T>(
  array: readonly T[],
  keyFn: (entry: T, index: number) => unknown,
): Map<unknown, number> => {
  const keyMap = new Map<unknown, number>();

  for (let i = 0; i < array.length; i++) {
    const key = keyFn(array[i], i);

    if (keyMap.has(key)) {
      throw new Error(`Duplicate key '${key}'`);
    }

    keyMap.set(key, i);
  }

  return keyMap;
};

export type ArrayMutation =
  | {
      type: "add" | "remove";
      key: unknown;
      index: number;
    }
  | {
      type: "move";
      key: unknown;
      from: number;
      to: number;
    };

export interface ArrayMutationResult {
  mutations: ArrayMutation[];
  map: Map<unknown, number>;
}

export const useArrayMutation = <T extends unknown>(
  array: SignalLike<readonly T[]>,
  keyFn: (entry: T, index: number) => unknown,
): Signal<ArrayMutationResult> => {
  const [result, setResult] = useSignal<ArrayMutationResult>({
    mutations: [],
    map: new Map(),
  });

  let indexMap = new Map<unknown, number>();

  useEffect(() => {
    const mutations: ArrayMutation[] = [];
    const oldIndexMap = indexMap;
    const newIndexMap = getIndexMap(array(), keyFn);

    const transformToOldIndex = (i: number = NaN) =>
      mutations
        .map((mutation): ((i: number) => number) =>
          mutation.type == "remove"
            ? (j) =>
                j < mutation.index ? j : j == mutation.index ? NaN : j - 1
            : mutation.type == "add"
              ? (j) => (j < mutation.index ? j : j + 1)
              : mutation.type == "move"
                ? (j) =>
                    mutation.to <= j && j < mutation.from
                      ? j + 1
                      : j == mutation.from
                        ? mutation.to
                        : j
                : (j) => j,
        )
        .reduce((i, fn) => fn(i), i);

    for (const key of oldIndexMap.keys()) {
      const i = transformToOldIndex(oldIndexMap.get(key));

      if (!newIndexMap.has(key)) {
        mutations.push({
          type: "remove",
          key,
          index: i,
        });
      }
    }

    for (let i = 0; i < array().length; i++) {
      const key = keyFn(array()[i], i);
      const oldIndex = transformToOldIndex(oldIndexMap.get(key));

      if (isNaN(oldIndex)) {
        mutations.push({
          type: "add",
          key,
          index: i,
        });
      } else if (oldIndex != i) {
        mutations.push({
          type: "move",
          key,
          from: oldIndex,
          to: i,
        });
      }
    }

    if (mutations.length > 0) {
      setResult({
        mutations,
        map: newIndexMap,
      });
    }

    indexMap = newIndexMap;
  });

  return result;
};
