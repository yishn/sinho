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
      _type: "a" | "r"; // add | remove
      _key: unknown;
      _index: number;
    }
  | {
      _type: "m"; // move
      _key: unknown;
      _from: number;
      _to: number;
    };

export interface ArrayMutationResult {
  _mutations: ArrayMutation[];
  _map: Map<unknown, number>;
}

export const useArrayMutation = <T extends unknown>(
  array: SignalLike<readonly T[]>,
  keyFn: (entry: T, index: number) => unknown,
): Signal<ArrayMutationResult> => {
  const [result, setResult] = useSignal<ArrayMutationResult>({
    _mutations: [],
    _map: new Map(),
  });

  let indexMap = new Map<unknown, number>();

  useEffect(() => {
    const mutations: ArrayMutation[] = [];
    const oldIndexMap = indexMap;
    const newIndexMap = getIndexMap(array(), keyFn);

    const transformToOldIndex = (i: number = NaN) =>
      mutations
        .map((mutation): ((i: number) => number) =>
          mutation._type == "r"
            ? (j) =>
                j < mutation._index ? j : j == mutation._index ? NaN : j - 1
            : mutation._type == "a"
              ? (j) => (j < mutation._index ? j : j + 1)
              : mutation._type == "m"
                ? (j) =>
                    mutation._to <= j && j < mutation._from
                      ? j + 1
                      : j == mutation._from
                        ? mutation._to
                        : j
                : (j) => j,
        )
        .reduce((i, fn) => fn(i), i);

    for (const key of oldIndexMap.keys()) {
      const i = transformToOldIndex(oldIndexMap.get(key));

      if (!newIndexMap.has(key)) {
        mutations.push({
          _type: "r",
          _key: key,
          _index: i,
        });
      }
    }

    for (let i = 0; i < array().length; i++) {
      const key = keyFn(array()[i], i);
      const oldIndex = transformToOldIndex(oldIndexMap.get(key));

      if (isNaN(oldIndex)) {
        mutations.push({
          _type: "a",
          _key: key,
          _index: i,
        });
      } else if (oldIndex != i) {
        mutations.push({
          _type: "m",
          _key: key,
          _from: oldIndex,
          _to: i,
        });
      }
    }

    if (mutations.length > 0) {
      setResult({
        _mutations: mutations,
        _map: newIndexMap,
      });
    }

    indexMap = newIndexMap;
  });

  return result;
};
