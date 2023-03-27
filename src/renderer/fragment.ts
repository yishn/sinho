import { Children, Component } from "./component.ts";
import { Renderer, Rendering } from "./renderer.ts";
import { RendererScope } from "./renderer_scope.ts";

export interface FragmentProps<R extends Renderer> {
  children?: Children<R>;
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
