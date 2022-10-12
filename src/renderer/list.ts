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
  destructor: Destructor;
}

interface ListProps<R extends Renderer, T, K> {
  source: SignalLike<T[]>;
  keyFn: (value: T, index: number) => K;
  eachFn: (value: Signal<T>, index: Signal<number>) => Component<R>;
}

export class List<R extends Renderer, T, K> extends Component<
  R,
  ListProps<R, T, K>
> {
  constructor(source: SignalLike<T[]>) {
    super({
      source,
      keyFn: (_, i) => i as K,
      eachFn: (_, __) => fragment(),
    });
  }

  key<K>(keyFn: (value: T, index: number) => K): List<R, T, K> {
    const self = this as unknown as List<R, T, K>;
    self.props.keyFn = keyFn;
    return self;
  }

  each(
    eachFn: (value: Signal<T>, index: Signal<number>) => Component<R>
  ): this {
    this.props.eachFn = eachFn;
    return this;
  }

  render(s: RendererScope<R>): Signal<Rendering<R>> {
    let firstTime = true;

    const endMarker: RendererNode<R> = s.renderer.createMarkerNode();
    const [rendering, setRendering] = s.signal<
      [list: Rendering<R>[], marker: RendererNode<R>]
    >([[], endMarker]);

    const state = new Map<K, StateEntry<R, T>>();
    let keys: K[] = [];

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
              const marker = s.renderer.createMarkerNode();
              const rendering = this.props
                .eachFn(value, index)
                .renderWithDestructor(s)[0];

              s.cleanup(() => s.renderer.removeNode(marker));

              Object.assign(entry, {
                index,
                setIndex,
                value,
                rendering,
                marker,
              });

              setRendering(
                (value) => {
                  value[0].splice(j, 0, rendering.peek());
                  return value;
                },
                { force: true }
              );

              s.effect(() => {
                setRendering(
                  (value) => {
                    value[0][index.peek()] = rendering();
                    return value;
                  },
                  { force: true }
                );
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

                s.renderer.insertRendering(rendering.peek(), beforeMarker);
              }
            },
            { leaked: true }
          );

          state.set(key, entry as StateEntry<R, T>);
        } else if (op[0] === ArrayOpType.Removed) {
          const i = op[1];
          const key = keys[i];
          const entry = state.get(key)!;

          setRendering(
            (value) => {
              value[0].splice(i, 1);
              return value;
            },
            { force: true }
          );

          entry.destructor();
          state.delete(key);
        } else if (op[0] === ArrayOpType.Move) {
          const [, i, j, needsMoving] = op;
          const key = newKeys[j];
          const entry = state.get(key)!;

          if (needsMoving) {
            const beforeKey = keys[j];
            const beforeMarker =
              beforeKey == null
                ? endMarker
                : state.get(beforeKey)?.marker ?? endMarker;

            setRendering(
              (value) => {
                const [rendering] = value[0].splice(i, 1);
                value[0].splice(j, 0, rendering);
                return value;
              },
              { force: true }
            );

            s.renderer.insertRendering(rendering.peek()[0][j], beforeMarker);
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

    return rendering;
  }
}

export function list<R extends Renderer, T>(
  source: SignalLike<T[]>
): List<R, T, number> {
  return new List(source);
}