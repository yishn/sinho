import { Component } from "./component.ts";
import { Renderer, RendererScope, Rendering } from "./renderer.ts";

export class Fragment extends Component<Component[]> {
  render<R extends Renderer>(s: RendererScope<R>): Rendering<R> {
    return this.props.map((component) => component.render(s));
  }
}

export function fragment(...components: Component[]): Fragment {
  return new Fragment(components);
}
