import { Destructor, Signal, SignalLike, SignalSetter } from "../scope.ts";
import { Component } from "./component.ts";
import { fragment } from "./fragment.ts";
import {
  Renderer,
  RendererNode,
  RendererScope,
  Rendering,
} from "./renderer.ts";

enum ArrayOpType {
  Added,
  Removed,
  Move,
}

type ArrayOp =
  | [type: ArrayOpType.Added, toIndex: number]
  | [type: ArrayOpType.Removed, fromIndex: number]
  | [
      type: ArrayOpType.Move,
      fromIndex: number,
      toIndex: number,
      moveNeeded: boolean
    ];

function diff<K>(
  from: K[],
  to: K[]
): [ops: ArrayOp[], valueOps: Map<K, ArrayOp>] {
  const valueOps = new Map<K, ArrayOp>();

  for (let i = 0; i < from.length; i++) {
    valueOps.set(from[i], [ArrayOpType.Removed, i]);
  }

  for (let j = 0; j < to.length; j++) {
    const oldEntry = valueOps.get(to[j]);

    if (oldEntry != null) {
      valueOps.set(to[j], [ArrayOpType.Move, oldEntry[1], j, false]);
    } else {
      valueOps.set(to[j], [ArrayOpType.Added, j]);
    }
  }

  const removedIndices: number[] = [];
  const ops: ArrayOp[] = [];

  for (let i = from.length - 1; i >= 0; i--) {
    const entry = valueOps.get(from[i]);

    if (entry?.[0] === ArrayOpType.Removed) {
      removedIndices.push(i);
      ops.push(entry);
    }
  }

  let added = 0;

  for (let j = 0; j < to.length; j++) {
    const entry = valueOps.get(to[j]);

    if (entry?.[0] === ArrayOpType.Added) {
      added++;
      ops.push(entry);
    } else if (entry?.[0] === ArrayOpType.Move) {
      const [i, j] = [entry[1], entry[2]];
      const removed =
        removedIndices.length - removedIndices.findLastIndex((j) => j > i) - 1;
      const iTransformed = i + added - removed;
      const moveNeeded = iTransformed !== j;

      if (moveNeeded || i !== j) {
        const newOp: ArrayOp = [ArrayOpType.Move, i, j, moveNeeded];

        ops.push(newOp);
        valueOps.set(to[j], newOp);
      }
    }
  }

  return [ops, valueOps];
}

interface StateEntry<R extends Renderer, T> {
  value: Signal<T>;
  index: Signal<number>;
  setIndex: SignalSetter<number>;
  marker: RendererNode<R>;
  rendering: RendererNode<R>[];
  destructor: Destructor;
}

interface ListProps<R extends Renderer, T> {
  source: SignalLike<T[]>;
  keyFn: (value: T, index: number) => unknown;
  eachFn: (value: Signal<T>, index: Signal<number>) => Component<R>;
}

export class List<R extends Renderer, T> extends Component<R, ListProps<R, T>> {
  constructor(source: SignalLike<T[]>) {
    super({
      source,
      keyFn: (_, i) => i,
      eachFn: (_, __) => fragment(),
    });
  }

  key<K>(keyFn: (value: T, index: number) => K): this {
    this.props.keyFn = keyFn;
    return this;
  }

  each(
    eachFn: (value: Signal<T>, index: Signal<number>) => Component<R>
  ): this {
    this.props.eachFn = eachFn;
    return this;
  }

  render(s: RendererScope<R>): Rendering<R> {
    let firstTime = true;

    const endMarker: RendererNode<R> = s.renderer.createMarkerNode();
    const state = new Map<unknown, StateEntry<R, T>>();
    let keys: unknown[] = [];

    s.effect(() => {
      const newKeys = this.props
        .source()
        .map((value, i) => this.props.keyFn(value, i));
      const [ops, keyOps] = diff(keys, newKeys);

      for (const op of ops) {
        if (op[0] === ArrayOpType.Added) {
          const j = op[1];
          const key = newKeys[j];
          const entry: Partial<StateEntry<R, T>> = {};

          entry.destructor = s.subscope(
            () => {
              const [index, setIndex] = s.signal(j);
              const value = s.memo(() => this.props.source()[index()]);
              const rendering = this.props
                .eachFn(value, index)
                .renderWithDestructor(s)[0];

              if (rendering.length === 0) {
                rendering.push(s.renderer.createMarkerNode());
                s.cleanup(() => s.renderer.removeNode(rendering[0]));
              }

              Object.assign(entry, {
                index,
                setIndex,
                value,
                rendering,
                marker: rendering[0],
              });

              if (!firstTime) {
                // Insert rendering

                const beforeKey = keys.find(
                  (key, i) =>
                    i >= j && keyOps.get(key)?.[0] !== ArrayOpType.Removed
                );
                const beforeMarker =
                  beforeKey == null
                    ? endMarker
                    : state.get(beforeKey)?.marker ?? endMarker;

                for (const node of rendering) {
                  s.renderer.insertNode(node, beforeMarker);
                }
              }
            },
            { leaked: true }
          );

          state.set(key, entry as StateEntry<R, T>);
        } else if (op[0] === ArrayOpType.Removed) {
          const key = keys[op[1]];
          const destructor = state.get(key)?.destructor;

          destructor?.();

          state.delete(key);
        } else if (op[0] === ArrayOpType.Move) {
          const [j, needsMoving] = [op[2], op[3]];
          const key = newKeys[j];
          const entry = state.get(key)!;

          if (needsMoving) {
            const beforeKey = keys[j];
            const beforeMarker =
              beforeKey == null
                ? endMarker
                : state.get(beforeKey)?.marker ?? endMarker;

            for (const node of entry.rendering) {
              s.renderer.insertNode(node, beforeMarker);
            }
          }

          entry.setIndex(j);
        }
      }

      keys = newKeys;
      firstTime = false;
    });

    s.cleanup(() => {
      for (const entry of state.values()) {
        entry.destructor();
      }
    });

    return [keys.flatMap((key) => state.get(key)?.rendering ?? []), endMarker];
  }
}

export function list<R extends Renderer, T>(
  source: SignalLike<T[]>
): List<R, T> {
  return new List(source);
}
