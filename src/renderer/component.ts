import { Renderer, RendererScope, Rendering } from "./renderer.ts";
import type { Destructor } from "../scope.ts";

export abstract class Component<
  out P = any,
  out R extends Renderer = Renderer
> {
  constructor(protected props: P) {}

  abstract render(s: RendererScope<R>): Component<any, R>;

  createRendering(s: RendererScope<R>): Rendering<R> {
    return this.render(s).createRendering(s);
  }

  createRenderingWithDestructor(
    s: RendererScope<R>
  ): [Rendering<R>, Destructor] {
    const lastComponent = s._currentComponent;
    s._currentComponent = this;

    let rendering: Rendering<R>;

    const destructor = s.subscope(() => {
      rendering = this.createRendering(s);

      s.cleanup(() => {
        s.renderer.removeRendering(rendering);
      });
    });

    s.renderer._renderingComponents.set(rendering!, this);
    s._currentComponent = lastComponent;

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
