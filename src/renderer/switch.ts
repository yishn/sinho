import type { SignalLike } from "../scope.ts";
import type {
  Renderer,
  RendererNode,
  RendererScope,
  Rendering,
} from "./renderer.ts";
import { Component } from "./component.ts";
import { Fragment } from "./fragment.ts";

export interface SwitchProps<R extends Renderer> {
  cases?: Case<R>[];
}

export class Switch<R extends Renderer> extends Component<SwitchProps<R>, R> {
  render(_: RendererScope<R>): Component<any, R> {
    throw new Error("unimplemented");
  }

  createRendering(s: RendererScope<R>): Rendering<R> {
    let firstTime = true;

    const marker = s.renderer.createMarkerNode();
    const rendering: [Rendering<R>, RendererNode<R>] = [[], marker];

    const result = s.memo(() => {
      for (const when of this.props.cases ?? []) {
        const memoizedCondition = s.memo(() => when.condition?.());

        if (memoizedCondition()) {
          return when.render?.() ?? new Fragment({});
        }
      }

      return new Fragment({});
    });

    s.effect(() => {
      const component = result();

      rendering[0] = component.createRenderingWithDestructor(s)[0];

      if (firstTime) {
        firstTime = false;
      } else {
        s.renderer.insertRendering(rendering[0], marker);
      }
    });

    return rendering;
  }
}

export interface Case<R extends Renderer> {
  condition?: SignalLike<boolean>;
  render?: () => Component<any, R>;
}

export function when<R extends Renderer>(
  condition: boolean | SignalLike<boolean>,
  render: () => Component<any, R>
): Case<R> {
  return {
    condition: typeof condition === "boolean" ? () => condition : condition,
    render,
  };
}

export interface WhenProps<R extends Renderer> {
  condition?: SignalLike<boolean>;
  then?: () => Component<any, R>;
  otherwise?: () => Component<any, R>;
}

export class When<R extends Renderer> extends Component<WhenProps<R>, R> {
  render(_: RendererScope<R>): Component<any, R> {
    return new Switch({
      cases: [
        when(
          this.props.condition ?? true,
          this.props.then ?? (() => new Fragment({}))
        ),
        when(true, this.props.otherwise ?? (() => new Fragment({}))),
      ],
    });
  }
}
