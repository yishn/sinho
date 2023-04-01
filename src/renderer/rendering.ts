import { Component } from "./component.ts";
import { Renderer, RendererNode } from "./renderer.ts";
import { RendererScope } from "./renderer_scope.ts";

export class Rendering<R extends Renderer> {
  component?: Component<any, R>;
  parent?: Rendering<R>;
  node?: RendererNode<R>;

  constructor(
    protected s: RendererScope<R>,
    protected data: (RendererNode<R> | Rendering<R>)[] = []
  ) {}

  [Symbol.iterator]() {
    return this.data[Symbol.iterator]();
  }

  getMarkerNode(index: number = 0): RendererNode<R> | undefined {
    if (index >= this.data.length) {
      const parentRendering = this.parent;

      return parentRendering?.getMarkerNode(
        (parentRendering?.data.indexOf(this) ?? -1) + 1
      );
    } else if (this.data[index] instanceof Rendering) {
      return (this.data[index] as Rendering<R>).getMarkerNode();
    }

    return this.data[index];
  }

  append(rendering: Rendering<R>): void {
    this.insert(rendering, this.data.length);
  }

  insert(rendering: Rendering<R>, index: number): void {
    const marker = this.getMarkerNode(index);

    if (marker != null) {
      this.s.renderer.insertRendering(rendering, marker);
    } else {
      const node = this.node;
      if (node != null) this.s.renderer.appendRendering(rendering, node);
    }

    this.data.splice(index, 0, rendering);
  }

  delete(index: number): RendererNode<R> | Rendering<R> | undefined {
    const [result] = this.data.splice(index, 1);

    if (result instanceof Rendering) {
      this.s.renderer.removeRendering(result);
    } else {
      this.s.renderer.removeNode(result);
    }

    return result;
  }
}
