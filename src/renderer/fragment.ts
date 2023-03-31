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

    const fromChildren = (children: Children<R>): Rendering<R> =>
      new Rendering(
        s,
        !Array.isArray(children)
          ? [children.render(s)]
          : children.map((entry) =>
              !Array.isArray(entry) ? entry.render(s) : fromChildren(entry)
            )
      );

    return fromChildren(children);
  }
}
