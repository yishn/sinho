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

export abstract class Component<out P = unknown> {
  constructor(protected props: P) {}

  abstract render<R extends Renderer>(s: RendererScope<R>): Rendering<R>;

  renderWithDestructor<R extends Renderer>(
    s: RendererScope<R>
  ): [Rendering<R>, Destructor] {
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

export type ComponentProps<C extends Component> = C extends Component<infer P>
  ? P
  : never;

const renderImplsSym = Symbol("renderImpls");

export abstract class SpecificComponent<out P = unknown> extends Component<P> {
  static [renderImplsSym]?: WeakMap<
    new (...args: any) => Renderer,
    (s: RendererScope<any>, props: any) => Rendering<Renderer>
  >;

  constructor(props: P) {
    super(props);
  }

  render<R extends Renderer>(s: RendererScope<R>): Rendering<R> {
    const render = (this.constructor as typeof SpecificComponent)[
      renderImplsSym
    ]?.get(s.renderer.constructor as new (...args: any) => Renderer);

    if (render == null) {
      throw new Error("Unsupported renderer");
    }

    return render(s, this.props);
  }
}

export function implRender<C extends SpecificComponent, R extends Renderer>(
  Component: new (...args: any) => C,
  Renderer: new (...args: any) => R,
  render: (s: RendererScope<R>, props: ComponentProps<C>) => Rendering<R>
): void {
  ((Component as typeof SpecificComponent)[renderImplsSym] ??=
    new WeakMap()).set(Renderer, render);
}
