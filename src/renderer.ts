import { Component } from "./component.js";
import { SignalLike, useEffect, useScope, useSubscope } from "./scope.js";

interface Renderer {
  _component?: Component;
  _svg?: boolean;
  _nodes?: IterableIterator<Node>;
  _ifConditions: SignalLike<boolean | undefined>[];

  _node<N extends Node>(fallback: () => N): N;
}

type RendererOverrides = Partial<Omit<Renderer, "_node">>;

const createRenderer = (override: RendererOverrides = {}): Renderer => ({
  _ifConditions: [],
  _node<N extends Node>(fallback: () => N): N {
    return (this._nodes?.next().value as N | undefined) ?? fallback();
  },
  ...override,
});

export const useRenderer = () => {
  const scope = useScope<{ _renderer?: Renderer }>();
  return (scope._details._renderer ??= createRenderer());
};

export const runWithRenderer = <T>(
  override: RendererOverrides,
  fn: () => T,
): T => {
  const currRenderer = useRenderer();
  const _renderer = createRenderer({
    ...currRenderer,
    ...override,
  });

  const [result, destroy] = useSubscope(fn, {
    details: { _renderer },
  });

  useEffect(() => destroy);

  return result;
};
