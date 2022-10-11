import { Component } from "./component.ts";
import { Renderer, RendererScope, Rendering } from "./renderer.ts";

export class Fragment<R extends Renderer> extends Component<R, Component<R>[]> {
  render(s: RendererScope<R>): Rendering<R> {
    return this.props.flatMap((component) => component.render(s));
  }
}

export function fragment<R extends Renderer>(
  ...components: Component<R>[]
): Fragment<R> {
  return new Fragment(components);
}
