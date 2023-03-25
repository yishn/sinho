import { Component } from "./component.ts";
import { Renderer, RendererScope, Rendering } from "./renderer.ts";

export interface FragmentProps<R extends Renderer> {
  children?: Component<any, R> | Component<any, R>[];
}

export class Fragment<R extends Renderer> extends Component<
  FragmentProps<R>,
  R
> {
  render(_: RendererScope<R>): never {
    throw new Error("unimplemented");
  }

  reify(s: RendererScope<R>): Rendering<R> {
    const { children = [] } = this.props;

    return (
      [children].flat(1).map((component) => component.reify(s)) ?? []
    );
  }
}
