import { Renderer, Rendering } from "./renderer.ts";
import { RendererScope } from "./renderer_scope.ts";
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
        s.renderer.removeRendering2(rendering);
      });
    });

    s.renderer.linkRenderingComponent(rendering!, this);
    s._current = lastComponent;

    return [rendering!, destructor];
  }
}

export interface ComponentConstructor<P = any, R extends Renderer = any> {
  isClassComponent?: boolean;
  new (props: P): Component<P, R>;
}

export interface FunctionComponent<P = any, R extends Renderer = any> {
  isClassComponent?: false;
  (props: P, s: RendererScope<R>): Component<any, R>;
}

export type ComponentType<P = any, R extends Renderer = any> =
  | ComponentConstructor<P, R>
  | FunctionComponent<P, R>;

export interface FunctionComponentWrapperProps<R extends Renderer> {
  functionComponent: (s: RendererScope<R>) => Component<any, R>;
}

export class FunctionComponentWrapper<
  R extends Renderer = any
> extends Component<FunctionComponentWrapperProps<R>, R> {
  render(s: RendererScope<R>): Rendering<R> {
    return this.props.functionComponent(s).render(s) ?? [];
  }
}

export function isClassComponent(
  component: FunctionComponent | ComponentConstructor
): component is ComponentConstructor {
  return !!component.isClassComponent;
}

export type ComponentProps<
  C extends ComponentConstructor | Component | FunctionComponent
> = C extends
  | ComponentConstructor<infer P, infer _>
  | Component<infer P, infer _>
  | FunctionComponent<infer P, infer _>
  ? P
  : never;

export type ComponentRenderer<
  C extends ComponentConstructor | Component | FunctionComponent
> = C extends
  | ComponentConstructor<infer _, infer R>
  | Component<infer _, infer R>
  | FunctionComponent<infer _, infer R>
  ? R
  : never;

export type Children<R extends Renderer> =
  | Component<any, R>
  | Component<any, R>[];
