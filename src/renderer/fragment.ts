import { Component } from "./component.ts";
import { Renderer, RendererScope, Rendering } from "./renderer.ts";

interface FragmentProps<R extends Renderer> {
  children?: Component<any, R> | Component<any, R>[];
}

export class Fragment<R extends Renderer> extends Component<
  FragmentProps<R>,
  R
> {
  render(s: RendererScope<R>): Rendering<R> {
    let { children } = this.props;
    if (children != null && !Array.isArray(children)) children = [children];

    return children?.map((component) => component.createRendering(s)) ?? [];
  }
}
