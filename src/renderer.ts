import { Component } from "./component.js";
import { useEffect, useScope, useSubscope } from "./scope.js";

interface Renderer {
  _component?: Component;
  _svg?: boolean;
  _nodes?: IterableIterator<Node>;

  _node<N extends Node>(fallback: () => N): N;
}

const createRenderer = (override: Partial<Renderer> = {}): Renderer => ({
  ...override,
  _node<N extends Node>(fallback: () => N): N {
    return (this._nodes?.next().value as N | undefined) ?? fallback();
  },
});

export const useRenderer = () => {
  const scope = useScope<{ _renderer?: Renderer }>();
  return (scope._details._renderer ??= createRenderer());
};

export const runWithRenderer = <T>(
  override: Partial<Renderer>,
  fn: (renderer: Renderer) => T,
): T => {
  const currRenderer = useRenderer();
  const _renderer = createRenderer({
    ...currRenderer,
    _nodes: undefined,
    ...override,
  });

  const [result, destroy] = useSubscope(() => fn(_renderer), {
    details: { _renderer },
  });

  useEffect(() => destroy);

  return result!;
};
