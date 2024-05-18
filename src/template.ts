export type TemplateNodes = (Node | TemplateNodes)[];

export namespace TemplateNodes {
  export const forEach = (
    nodes: TemplateNodes,
    fn: (node: Node) => void,
  ): void =>
    nodes.forEach((node) =>
      Array.isArray(node) ? TemplateNodes.forEach(node, fn) : fn(node),
    );

  export const last = (
    nodes: TemplateNodes,
    lastIndex: number = nodes.length - 1,
  ): Node | undefined => {
    if (!nodes.length) return;

    for (let i = lastIndex; i >= 0; i--) {
      const last = nodes[i];
      if (!Array.isArray(last)) return last;

      const lastNode = TemplateNodes.last(last);
      if (lastNode) return lastNode;
    }
  };
}

/**
 * Represents a render result of a component.
 */
export interface Template {
  /**
   * Build the DOM elements represented by this template.
   */
  build(): TemplateNodes;
}

export const createTemplate = (
  build: () => Template | TemplateNodes,
): Template => ({
  build() {
    const nodes = build();
    return (nodes as Template).build?.() ?? nodes;
  },
});
