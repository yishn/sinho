import type { SignalLike } from "./scope.js";

/**
 * Represents a render result of a component.
 */
export interface Template {
  /**
   * Build the DOM elements represented by this template.
   */
  build(): SignalLike<Node[]>;
}

export const createTemplate = (
  build: () => Template | SignalLike<Node[]>,
): Template => ({
  build() {
    const nodes = build();
    return (nodes as Template).build?.() ?? nodes;
  },
});
