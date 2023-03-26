import { Renderer, RendererScope, Rendering } from "./renderer.ts";
import type { Destructor } from "../scope.ts";

export abstract class Component<P = any, R extends Renderer = any> {
  static isClassComponent = true;

  constructor(protected props: P) {}

  abstract render(s: RendererScope<R>): Rendering<R>;

  renderWithDestructor(s: RendererScope<R>): [Rendering<R>, Destructor] {
    const lastComponent = s._current;
    s._current = this;

    let rendering: Rendering<R>;

    const destructor = s.subscope(() => {
      rendering = this.render(s);

      s.cleanup(() => {
        s.renderer.removeRendering(rendering);
      });
    });

    s.renderer._renderingComponents.set(rendering!, this);
    s._current = lastComponent;

    return [rendering!, destructor];
  }
}

export interface FunctionComponent<P = any, R extends Renderer = any> {
  (props: P, s: RendererScope<R>): Component<any, R>;
}

export class FunctionComponentWrapper<
  P = any,
  R extends Renderer = any
> extends Component<P, R> {
  constructor(props: P, public functionComponent: FunctionComponent<P, R>) {
    super(props);
  }

  render(s: RendererScope<R>): Rendering<R> {
    return this.functionComponent(this.props, s).render(s) ?? [];
  }
}

export type ComponentProps<C extends Component | FunctionComponent> = C extends
  | Component<infer P, infer _>
  | FunctionComponent<infer P, infer _>
  ? P
  : never;

export type ComponentRenderer<C extends Component | FunctionComponent> =
  C extends Component<infer _, infer R> | FunctionComponent<infer _, infer R>
    ? R
    : never;

export type Children<R extends Renderer> =
  | Component<any, R>
  | Component<any, R>[];
