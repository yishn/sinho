import { Destructor, Signal, SignalLike, SignalSetter } from "../scope.ts";
import { Component } from "./component.ts";
import { Fragment } from "./fragment.ts";
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

interface StateEntry<R extends Renderer, T> {
  value: Signal<T>;
  index: Signal<number>;
  setIndex: SignalSetter<number>;
  marker: RendererNode<R>;
  destructor: Destructor;
}

interface ForProps<T, K, R extends Renderer> {
  source: SignalLike<T[]>;
  key: (value: T, index: number) => K;
  each: (value: Signal<T>, index: Signal<number>) => Component<any, R>;
}

export class ForComponent<T, K, R extends Renderer> extends Component<
  ForProps<T, K, R>,
  R
> {
  constructor(source: SignalLike<T[]>) {
    super({
      source,
      key: (_, i) => i as K,
      each: (_, __) => new Fragment({}),
    });
  }

  key<K>(keyFn: (value: T, index: number) => K): ForComponent<T, K, R> {
    const self = this as unknown as ForComponent<T, K, R>;
    self.props.key = keyFn;
    return self;
  }

  each(
    eachFn: (value: Signal<T>, index: Signal<number>) => Component<any, R>
  ): this {
    this.props.each = eachFn;
    return this;
  }

  render(s: RendererScope<R>): Rendering<R> {
    let firstTime = true;

    const endMarker: RendererNode<R> = s.renderer.createMarkerNode();
    const rendering: [marker: RendererNode<R>, rendering: Rendering<R>][] = [];

    const state = new Map<K, StateEntry<R, T>>();
    let keys: K[] = [];

    s.effect(() => {
      const newKeys = this.props
        .source()
        .map((value, i) => this.props.key(value, i));
      const [ops] = diff(keys, newKeys);

      for (const op of ops) {
        if (op[0] === ArrayOpType.Added) {
          const j = op[1];
          const key = newKeys[j];
          const entry: Partial<StateEntry<R, T>> = {};

          entry.destructor = s.subscope(
            () => {
              const [index, setIndex] = s.signal(j);
              const value: Signal<T> = s.memo(() =>
                index() < this.props.source().length && index() >= 0
                  ? this.props.source()[index()]
                  : value.peek()
              );
              const marker: RendererNode<R> = s.renderer.createMarkerNode();
              const eachRendering: [
                marker: RendererNode<R>,
                rendering: Rendering<R>
              ] = [
                marker,
                this.props
                  .each(value, index)
                  .createRenderingWithDestructor(s)[0],
              ];

              s.cleanup(() => s.renderer.removeNode(marker));

              Object.assign(entry, {
                index,
                setIndex,
                value,
                marker,
              });

              if (!firstTime) {
                // Insert rendering

                const beforeMarker = rendering[j]?.[0] ?? endMarker;
                s.renderer.insertRendering(eachRendering, beforeMarker);
              }

              rendering.splice(j, 0, eachRendering);
            },
            { leaked: true }
          );

          state.set(key, entry as StateEntry<R, T>);
        } else if (op[0] === ArrayOpType.Removed) {
          const i = op[1];
          const key = keys[i];
          const entry = state.get(key)!;

          rendering.splice(i, 1);
          entry.destructor();
          state.delete(key);
        } else if (op[0] === ArrayOpType.Move) {
          const [, tempIndex, j] = op;
          const key = newKeys[j];
          const entry = state.get(key)!;

          if (tempIndex !== j) {
            const beforeMarker = rendering[j]?.[0] ?? endMarker;
            const [eachRendering] = rendering.splice(tempIndex, 1);

            s.renderer.insertRendering(eachRendering, beforeMarker);
            rendering.splice(j, 0, eachRendering);
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

    return [rendering, endMarker];
  }
}

export function For<T, R extends Renderer>(
  source: SignalLike<T[]>
): ForComponent<T, number, R> {
  return new ForComponent(source);
}
