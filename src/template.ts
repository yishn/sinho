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
