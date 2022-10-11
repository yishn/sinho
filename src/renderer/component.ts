import {
  Renderer,
  RendererNode,
  RendererScope,
  Rendering,
} from "./renderer.ts";
import type { Destructor } from "../scope.ts";

export function isComponent(value: any): value is Component<Renderer> {
  return typeof value.renderWithDestructor === "function";
}

export abstract class Component<R extends Renderer, out P = unknown> {
  constructor(protected props: P) {}

  abstract render(s: RendererScope<R>): Rendering<R>;

  renderNormalized(s: RendererScope<R>): RendererNode<R>[] {
    function normalize(rendering: Rendering<R>): RendererNode<R>[] {
      if (rendering == null) {
        return [];
      } else if (!Array.isArray(rendering)) {
        if (isComponent(rendering)) {
          return normalize(rendering.render(s));
        } else {
          return [rendering];
        }
      }

      return rendering.flatMap((value) => normalize(value));
    }

    return normalize(this.render(s));
  }

  renderWithDestructor(s: RendererScope<R>): [RendererNode<R>[], Destructor] {
    let rendering: RendererNode<R>[] = [];

    const destructor = s.subscope(() => {
      rendering = this.renderNormalized(s);

      s.cleanup(() => {
        for (const node of rendering) {
          s.renderer.removeNode(node);
        }
      });
    });

    return [rendering, destructor];
  }
}
