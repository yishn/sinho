import {
  Renderer,
  RendererNode,
  RendererScope,
  Rendering,
} from "./renderer.ts";
import type { Destructor, Signal } from "../scope.ts";

export function flattenRendering<R extends Renderer>(
  rendering: Rendering<R>
): RendererNode<R>[] {
  if (rendering == null) {
    return [];
  } else if (!Array.isArray(rendering)) {
    return [rendering];
  }

  return rendering.flatMap((value) => flattenRendering(value));
}

export abstract class Component<R extends Renderer, out P = unknown> {
  constructor(protected props: P) {}

  abstract render(s: RendererScope<R>): Signal<Rendering<R>>;

  renderWithDestructor(
    s: RendererScope<R>
  ): [Signal<Rendering<R>>, Destructor] {
    let rendering: Signal<Rendering<R>>;

    const destructor = s.subscope(() => {
      rendering = this.render(s);

      s.cleanup(() => {
        s.renderer.removeRendering(rendering());
      });
    });

    return [rendering!, destructor];
  }
}
