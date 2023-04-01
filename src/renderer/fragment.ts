import { Children, Component } from "./component.ts";
import { Renderer } from "./renderer.ts";
import { RendererScope } from "./renderer_scope.ts";
import { Rendering } from "./rendering.ts";

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
        children == null
          ? []
          : children instanceof Component
          ? [children.render(s)]
          : children.map((entry) =>
              entry == null
                ? []
                : entry instanceof Component
                ? entry.render(s)
                : fromChildren(entry)
            )
      );

    return fromChildren(children);
  }
}
