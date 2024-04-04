interface Renderer {
  _isSvg?: boolean;
  _nodes?: IterableIterator<Node>;

  _node<N extends Node>(fallback: () => N): N;
}

const createRenderer = (): Renderer => ({
  _node<N extends Node>(fallback: () => N): N {
    return (this._nodes?.next().value as N | undefined) ?? fallback();
  },
});

let currRenderer = createRenderer();

export const useRenderer = () => currRenderer;

export const runWithRenderer = <T>(fn: (renderer: Renderer) => T): T => {
  const prevRenderer = currRenderer;
  currRenderer._isSvg = prevRenderer._isSvg;

  try {
    return fn(currRenderer);
  } finally {
    currRenderer = prevRenderer;
  }
};
