import { Component } from "./component.ts";
import { Renderer, RendererScope, Rendering } from "./renderer.ts";

export interface FragmentProps<R extends Renderer> {
  children?: Component<any, R> | Component<any, R>[];
}

export class Fragment<R extends Renderer> extends Component<
  FragmentProps<R>,
  R
> {
  render(s: RendererScope<R>): Rendering<R> {
    const { children = [] } = this.props;

    return !Array.isArray(children)
      ? [children.render(s)]
      : children.map((component) => component.render(s)) ?? [];
  }
}
