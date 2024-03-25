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

/**
 * Represents a render result of a component.
 */
export interface Template {
  /**
   * Build the DOM elements represented by this template.
   */
  build(): Node[];
}

export const createTemplate = (build: () => Template | Node[]): Template => ({
  build() {
    const nodes = build();
    return (nodes as Template).build?.() ?? nodes;
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
