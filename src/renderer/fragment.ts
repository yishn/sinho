import { Signal } from "../scope.ts";
import { Component } from "./component.ts";
import { Renderer, RendererScope, Rendering } from "./renderer.ts";

export class Fragment<R extends Renderer> extends Component<R, Component<R>[]> {
  render(s: RendererScope<R>): Signal<Rendering<R>> {
    let [rendering, setRendering] = s.signal<Rendering<R>[]>(
      Array(this.props.length).fill(null)
    );

    for (let i = 0; i < this.props.length; i++) {
      const rendering = this.props[i].render(s);

      s.effect(() => {
        setRendering(
          (value) => {
            value[i] = rendering();
            return value;
          },
          { force: true }
        );
      });
    }

    return rendering;
  }
}

export function fragment<R extends Renderer>(
  ...components: Component<R>[]
): Fragment<R> {
  return new Fragment(components);
}
