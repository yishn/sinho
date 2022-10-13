import { Component } from "./component.ts";
import { Renderer, RendererScope, Rendering } from "./renderer.ts";

export class FragmentComponent extends Component<Component[]> {
  render<R extends Renderer>(s: RendererScope<R>): Rendering<R> {
    return this.props.map((component) => component.render(s));
  }
}

export function Fragment(...components: Component[]): FragmentComponent {
  return new FragmentComponent(components);
}
