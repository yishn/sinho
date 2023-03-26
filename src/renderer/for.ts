import { Destructor, Signal, SignalLike, SignalSetter } from "../scope.ts";
import { Component } from "./component.ts";
import {
  getMarker,
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
  | [type: ArrayOpType.Move, tempIndex: number, toIndex: number];

function diff<K>(
  from: K[],
  to: K[]
): [ops: ArrayOp[], valueOps: Map<K, ArrayOp>] {
  const valueOps = new Map<K, ArrayOp>();
  let needMove = false;

  for (let i = 0; i < from.length; i++) {
    valueOps.set(from[i], [ArrayOpType.Removed, i]);
  }

  for (let j = 0; j < to.length; j++) {
    const oldEntry = valueOps.get(to[j]);

    if (oldEntry != null) {
      needMove = true;
      valueOps.set(to[j], [ArrayOpType.Move, oldEntry[1], j]);
    } else {
      valueOps.set(to[j], [ArrayOpType.Added, j]);
    }
  }

  const temp = needMove ? [...from] : null;
  const ops: ArrayOp[] = [];

  for (let i = from.length - 1; i >= 0; i--) {
    const entry = valueOps.get(from[i]);

    if (entry?.[0] === ArrayOpType.Removed) {
      temp?.splice(i, 1);
      ops.push(entry);
    }
  }

  for (let j = 0; j < to.length; j++) {
    const entry = valueOps.get(to[j]);

    if (entry?.[0] === ArrayOpType.Added) {
      temp?.splice(j, 0, to[j]);
      ops.push(entry);
    } else if (entry?.[0] === ArrayOpType.Move) {
      const [, , j] = entry;
      const tempIndex = temp?.indexOf(to[j], j) ?? -1;

      if (tempIndex !== j) {
        // Move needed

        temp?.splice(tempIndex, 1);
        temp?.splice(j, 0, to[j]);
      }

      ops.push([ArrayOpType.Move, tempIndex, j]);
    }
  }

  return [ops, valueOps];
}

interface StateEntry<T> {
  value: SignalLike<T>;
  index: SignalLike<number>;
  setIndex: SignalSetter<number>;
  destructor: Destructor;
}

export interface ForProps<T, R extends Renderer> {
  source?: SignalLike<T[]>;
  key?: (value: T, index: number) => string | number;
  children?: (value: Signal<T>, index: Signal<number>) => Component<any, R>;
}

class IndexedFor<T, R extends Renderer> extends Component<
  Omit<ForProps<T, R>, "key">,
  R
> {
  render(s: RendererScope<R>): Rendering<R> {
    let firstTime = true;

    const { source = () => [] } = this.props;
    const rendering: Rendering<R>[] = [];
    const state: StateEntry<T>[] = [];

    s.effect(() => {
      const length = state.length;
      const newLength = source().length;
      const append = newLength >= length ? true : false;

      if (append) {
        for (let i = length; i < newLength; i++) {
          const entry: Partial<StateEntry<T>> = {};

          entry.destructor = s.subscope(
            () => {
              const [index] = s.signal(i);
              const value: Signal<T> = s.memo(() =>
                i < source().length && i >= 0 ? source()[i] : value.peek()
              );
              const eachRendering: Rendering<R> =
                this.props
                  .children?.(value, index)
                  .renderWithDestructor(s)[0] ?? [];

              Object.assign(entry, {
                index,
                setIndex: () => {},
                value,
              });

              if (!firstTime) {
                // Insert rendering

                s.renderer.insertIntoRendering(eachRendering, rendering, i);
              } else {
                rendering.push(eachRendering);
              }
            },
            { leaked: true }
          );

          state.push(entry as StateEntry<T>);
        }
      } else {
        for (let i = length - 1; i >= newLength; i--) {
          const entry = state.pop()!;

          s.renderer.removeFromRendering(rendering, i);
          entry.destructor();
        }
      }

      firstTime = false;
    });

    s.cleanup(() => {
      for (const entry of state) {
        entry.destructor();
      }
    });

    return rendering;
  }
}

export class For<T, R extends Renderer> extends Component<ForProps<T, R>, R> {
  render(s: RendererScope<R>): Rendering<R> {
    if (this.props.key == null) {
      return new IndexedFor(this.props).render(s);
    }

    type K = string | number;

    const { source = () => [], key } = this.props;
    let firstTime = true;

    const rendering: Rendering<R>[] = [];
    const state = new Map<K, StateEntry<T>>();
    let keys: K[] = [];

    s.effect(() => {
      const newKeys = source().map((value, i) => key(value, i) ?? i);
      const [ops] = diff(keys, newKeys);

      for (const op of ops) {
        if (op[0] === ArrayOpType.Added) {
          const j = op[1];
          const key = newKeys[j];
          const entry: Partial<StateEntry<T>> = {};

          entry.destructor = s.subscope(
            () => {
              const [index, setIndex] = s.signal(j);
              const value: Signal<T> = s.memo(() =>
                index() < source().length && index() >= 0
                  ? source()[index()]
                  : value.peek()
              );
              const eachRendering: Rendering<R> =
                this.props
                  .children?.(value, index)
                  .renderWithDestructor(s)[0] ?? [];

              Object.assign(entry, {
                index,
                setIndex,
                value,
              });

              if (!firstTime) {
                // Insert rendering

                s.renderer.insertIntoRendering(eachRendering, rendering, j);
              } else {
                rendering.splice(j, 0, eachRendering);
              }
            },
            { leaked: true }
          );

          state.set(key, entry as StateEntry<T>);
        } else if (op[0] === ArrayOpType.Removed) {
          const i = op[1];
          const key = keys[i];
          const entry = state.get(key)!;

          s.renderer.removeFromRendering(rendering, i);

          entry.destructor();
          state.delete(key);
        } else if (op[0] === ArrayOpType.Move) {
          const [, tempIndex, j] = op;
          const key = newKeys[j];
          const entry = state.get(key)!;

          if (tempIndex !== j) {
            const [eachRendering] = rendering.splice(tempIndex, 1);

            s.renderer.insertIntoRendering(eachRendering, rendering, j);
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
