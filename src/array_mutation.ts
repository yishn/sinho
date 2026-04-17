import { Signal, SignalLike, useEffect, useSignal } from "./scope.js";

const getIndexMap = <T>(
  array: readonly T[],
  keyFn: (entry: T, index: number) => unknown,
  oldIndexMap: Map<unknown, number>,
): {
  _indexMap: Map<unknown, number>;
  _removedFromOld: Array<{
    _key: unknown;
    _oldIndex: number;
    _removedBefore: number;
  }>;
} => {
  const _indexMap = new Map<unknown, number>();

  for (let i = 0; i < array.length; i++) {
    const key = keyFn(array[i], i);

    if (_indexMap.has(key)) {
      throw new Error(`Duplicate key '${key}'`);
    }

    _indexMap.set(key, i);
  }

  const _removedFromOld: Array<{
    _key: unknown;
    _oldIndex: number;
    _removedBefore: number;
  }> = [];
  let removedBefore = 0;

  for (const [key, i] of oldIndexMap) {
    if (!_indexMap.has(key)) {
      _removedFromOld.push({
        _key: key,
        _oldIndex: i,
        _removedBefore: removedBefore++,
      });
    }
  }

  return { _indexMap, _removedFromOld };
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
    const { _indexMap: newIndexMap, _removedFromOld } = getIndexMap(
      array(),
      keyFn,
      oldIndexMap,
    );

    const transformToOldIndex = (i: number = NaN) => {
      let index = i;

      for (const mutation of mutations) {
        if (isNaN(index)) break;

        if (mutation._type == "r") {
          index =
            index < mutation._index
              ? index
              : index == mutation._index
                ? NaN
                : index - 1;
        } else if (mutation._type == "a") {
          index = index < mutation._index ? index : index + 1;
        } else if (mutation._type == "m") {
          index =
            mutation._to <= index && index < mutation._from
              ? index + 1
              : index == mutation._from
                ? mutation._to
                : index;
        }
      }

      return index;
    };

    for (const entry of _removedFromOld) {
      mutations.push({
        _type: "r",
        _key: entry._key,
        _index: entry._oldIndex - entry._removedBefore,
      });
    }

    for (const [key, i] of newIndexMap) {
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
