import { Renderer, RendererScope, Rendering } from "./renderer.ts";
import type { Destructor } from "../scope.ts";

export abstract class Component<
  out P = any,
  out R extends Renderer = Renderer
> {
  constructor(protected props: P) {}

  abstract render(s: RendererScope<R>): Component<any, R>;

  reify(s: RendererScope<R>): Rendering<R> {
    return this.render(s).reify(s);
  }

  reifyWithDestructor(s: RendererScope<R>): [Rendering<R>, Destructor] {
    const lastComponent = s._current;
    s._current = this;

    let rendering: Rendering<R>;

    const destructor = s.subscope(() => {
      rendering = this.reify(s);

      s.cleanup(() => {
        s.renderer.removeRendering(rendering);
      });
    });

    s.renderer._renderingComponents.set(rendering!, this);
    s._current = lastComponent;

    return [rendering!, destructor];
  }
}

export type ComponentProps<C extends Component> = C extends Component<
  infer P,
  infer _
>
  ? P
  : never;

export type ComponentRenderer<C extends Component> = C extends Component<
  infer _,
  infer R
>
  ? R
  : never;
