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
  const temp = [...from];

  for (let i = 0; i < from.length; i++) {
    valueOps.set(from[i], [ArrayOpType.Removed, i]);
  }

  for (let j = 0; j < to.length; j++) {
    const oldEntry = valueOps.get(to[j]);

    if (oldEntry != null) {
      valueOps.set(to[j], [ArrayOpType.Move, oldEntry[1], j]);
    } else {
      valueOps.set(to[j], [ArrayOpType.Added, j]);
    }
  }

  const ops: ArrayOp[] = [];

  for (let i = from.length - 1; i >= 0; i--) {
    const entry = valueOps.get(from[i]);

    if (entry?.[0] === ArrayOpType.Removed) {
      temp.splice(i, 1);
      ops.push(entry);
    }
  }

  for (let j = 0; j < to.length; j++) {
    const entry = valueOps.get(to[j]);

    if (entry?.[0] === ArrayOpType.Added) {
      temp.splice(j, 0, to[j]);
      ops.push(entry);
    } else if (entry?.[0] === ArrayOpType.Move) {
      const [, i, j] = entry;
      const tempIndex = temp.indexOf(to[j]);

      if (tempIndex !== j) {
        // Move needed

        temp.splice(tempIndex, 1);
        temp.splice(j, 0, to[j]);
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

interface ForProps<T, K> {
  source: SignalLike<T[]>;
  keyFn: (value: T, index: number) => K;
  eachFn: (value: Signal<T>, index: Signal<number>) => Component;
}

export class ForComponent<T, K> extends Component<ForProps<T, K>> {
  constructor(source: SignalLike<T[]>) {
    super({
      source,
      keyFn: (_, i) => i as K,
      eachFn: (_, __) => new Fragment({}),
    });
  }

  key<K>(keyFn: (value: T, index: number) => K): ForComponent<T, K> {
    const self = this as unknown as ForComponent<T, K>;
    self.props.keyFn = keyFn;
    return self;
  }

  each(eachFn: (value: Signal<T>, index: Signal<number>) => Component): this {
    this.props.eachFn = eachFn;
    return this;
  }

  render<R extends Renderer>(s: RendererScope<R>): Rendering<R> {
    let firstTime = true;

    const endMarker: RendererNode<R> = s.renderer.createMarkerNode();
    const rendering: [
      list: [marker: RendererNode<R>, rendering: Rendering<R>][],
      marker: RendererNode<R>
    ] = [[], endMarker];

    const state = new Map<K, StateEntry<R, T>>();
    let keys: K[] = [];

    s.effect(() => {
      const newKeys = this.props
        .source()
        .map((value, i) => this.props.keyFn(value, i));
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
                  .eachFn(value, index)
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

                const beforeMarker = rendering[0][j]?.[0] ?? endMarker;
                s.renderer.insertRendering(eachRendering, beforeMarker);
              }

              rendering[0].splice(j, 0, eachRendering);
            },
            { leaked: true }
          );

          state.set(key, entry as StateEntry<R, T>);
        } else if (op[0] === ArrayOpType.Removed) {
          const i = op[1];
          const key = keys[i];
          const entry = state.get(key)!;

          rendering[0].splice(i, 1);
          entry.destructor();
          state.delete(key);
        } else if (op[0] === ArrayOpType.Move) {
          const [, tempIndex, j] = op;
          const key = newKeys[j];
          const entry = state.get(key)!;

          if (tempIndex !== j) {
            const beforeMarker = rendering[0][j]?.[0] ?? endMarker;
            const [eachRendering] = rendering[0].splice(tempIndex, 1);

            s.renderer.insertRendering(eachRendering, beforeMarker);
            rendering[0].splice(j, 0, eachRendering);
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

export function For<T>(source: SignalLike<T[]>): ForComponent<T, number> {
  return new ForComponent(source);
}
