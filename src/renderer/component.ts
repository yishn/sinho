import { Renderer } from "./renderer.ts";
import { RendererScope } from "./renderer_scope.ts";
import type { Destructor } from "../scope.ts";
import { Rendering } from "./rendering.ts";

type RenderFunction<C extends Component, R extends Renderer> = (
  this: C,
  s: RendererScope<R>
) => Rendering<R>;

const renderMap = new WeakMap<
  ComponentConstructor,
  WeakMap<new (...args: any) => Renderer, RenderFunction<Component, Renderer>>
>();

export abstract class Component<P = any> {
  static isClassComponent = true;

  static implRender<T extends ComponentConstructor, R extends Renderer>(
    this: T,
    renderer: new (...args: any) => R,
    render: RenderFunction<InstanceType<T>, R>
  ): void {
    const map =
      renderMap.get(this) ??
      new WeakMap<
        new (...args: any) => Renderer,
        RenderFunction<Component, Renderer>
      >();
    renderMap.set(this, map);

    map.set(renderer, render as any);
  }

  constructor(public props: P) {}

  render<R extends Renderer>(s: RendererScope<R>): Rendering<R> {
    const rendering = renderMap
      .get(this.constructor as ComponentConstructor)
      ?.get(s.renderer.constructor as new (...args: any) => Renderer)
      ?.call(this, s) as Rendering<R> | undefined;

    if (rendering != null) {
      return rendering;
    }

    throw new Error("unsupported renderer");
  }

  renderWithDestructor<R extends Renderer>(
    s: RendererScope<R>
  ): [Rendering<R>, Destructor] {
    const lastComponent = s._current;
    s._current = this;

    let rendering: Rendering<R>;

    const destructor = s.subscope(() => {
      rendering = this.render(s);

      s.cleanup(() => {
        s.renderer.removeRendering(rendering);
      });
    });

    s.renderer.linkRenderingComponent(rendering!, this);
    s._current = lastComponent;

    return [rendering!, destructor];
  }
}

export interface ComponentConstructor<P = any> {
  isClassComponent?: boolean;
  new (props: P): Component<P>;
}

export interface FunctionComponent<P = any> {
  isClassComponent?: false;
  (props: P, s: RendererScope<Renderer>): Component<any>;
}

export type ComponentType<P = any> =
  | ComponentConstructor<P>
  | FunctionComponent<P>;

export interface FunctionComponentWrapperProps {
  name: string;
  functionComponent: FunctionComponent<{}>;
}

export class FunctionComponentWrapper extends Component<FunctionComponentWrapperProps> {
  render<R extends Renderer>(s: RendererScope<R>): Rendering<R> {
    return this.props.functionComponent({}, s).render(s) ?? new Rendering(s);
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
  | ComponentConstructor<infer P>
  | Component<infer P>
  | FunctionComponent<infer P>
  ? P
  : never;

export type Children = null | undefined | Component | Children[];
