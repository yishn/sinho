import {
  Renderer,
  RendererNode,
  RendererScope,
  Rendering,
} from "./renderer.ts";
import type { Destructor } from "../scope.ts";

export function flattenRendering<R extends Renderer>(
  rendering: Rendering<R>
): RendererNode<R>[] {
  return rendering.flatMap((value) =>
    Array.isArray(value) ? flattenRendering(value) : value
  );
}

export abstract class Component<R extends Renderer, out P = unknown> {
  constructor(protected props: P) {}

  abstract render(s: RendererScope<R>): Rendering<R>;

  renderWithDestructor(s: RendererScope<R>): [Rendering<R>, Destructor] {
    let rendering: Rendering<R>;

    const destructor = s.subscope(() => {
      rendering = this.render(s);

      s.cleanup(() => {
        s.renderer.removeRendering(rendering);
      });
    });

    return [rendering!, destructor];
  }
}
