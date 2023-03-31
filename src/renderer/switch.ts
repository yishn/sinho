import type { SignalLike } from "../scope.ts";
import { Renderer, Rendering } from "./renderer.ts";
import { Component } from "./component.ts";
import { Fragment } from "./fragment.ts";
import { RendererScope } from "./renderer_scope.ts";

export interface SwitchProps<R extends Renderer> {
  cases?: Case<R>[];
}

export class Switch<R extends Renderer> extends Component<SwitchProps<R>, R> {
  render(s: RendererScope<R>): Rendering<R> {
    const rendering = new Rendering(s, []);

    const result = s.memo(() => {
      for (const when of this.props.cases ?? []) {
        const memoizedCondition = s.memo(() => when.condition?.());

        if (memoizedCondition()) {
          return when.component ?? new Fragment<R>({});
        }
      }

      return new Fragment<R>({});
    });

    s.effect(() => {
      const component = result();
      const [childRendering] = component.renderWithDestructor(s);

      rendering.append(childRendering);

      s.cleanup(() => rendering.delete(0));
    });

    return rendering;
  }
}

export interface Case<R extends Renderer> {
  condition?: SignalLike<boolean>;
  component?: Component<any, R>;
}

export function when<R extends Renderer>(
  condition: boolean | SignalLike<boolean>,
  component: Component<any, R>
): Case<R> {
  return {
    condition: typeof condition === "boolean" ? () => condition : condition,
    component,
  };
}

export interface WhenProps<R extends Renderer> {
  condition?: SignalLike<boolean>;
  then?: Component<any, R>;
  otherwise?: Component<any, R>;
}

export class When<R extends Renderer> extends Component<WhenProps<R>, R> {
  render(s: RendererScope<R>): Rendering<R> {
    return new Switch<R>({
      cases: [
        when(this.props.condition ?? true, this.props.then ?? new Fragment({})),
        when(true, this.props.otherwise ?? new Fragment({})),
      ],
    }).render(s);
  }
}
