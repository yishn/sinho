import { Component } from "./component.ts";
import { Renderer, RendererScope, Rendering } from "./renderer.ts";

interface FragmentProps {
  children?: Component[];
}

export class Fragment extends Component<FragmentProps> {
  render<R extends Renderer>(s: RendererScope<R>): Rendering<R> {
    return (
      this.props.children?.map((component) => component.createRendering(s)) ??
      []
    );
  }
}
