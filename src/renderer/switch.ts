import type { SignalLike } from "../scope.ts";
import { Renderer } from "./renderer.ts";
import { Component } from "./component.ts";
import { Fragment } from "./fragment.ts";
import { RendererScope } from "./renderer_scope.ts";
import { Rendering } from "./rendering.ts";

export interface SwitchProps {
  cases?: Case[];
}

export class Switch extends Component<SwitchProps> {
  render<R extends Renderer>(s: RendererScope<R>): Rendering<R> {
    const rendering = new Rendering(s);

    const result = s.memo(() => {
      for (const when of this.props.cases ?? []) {
        const memoizedCondition = s.memo(() => when.condition?.());

        if (memoizedCondition()) {
          return when.component ?? new Fragment({});
        }
      }

      return new Fragment({});
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

export interface Case {
  condition?: SignalLike<boolean>;
  component?: Component;
}

export function when(
  condition: boolean | SignalLike<boolean>,
  component: Component
): Case {
  return {
    condition: typeof condition === "boolean" ? () => condition : condition,
    component,
  };
}

export interface WhenProps {
  condition?: SignalLike<boolean>;
  then?: Component;
  otherwise?: Component;
}

export class When extends Component<WhenProps> {
  render<R extends Renderer>(s: RendererScope<R>): Rendering<R> {
    return new Switch({
      cases: [
        when(this.props.condition ?? true, this.props.then ?? new Fragment({})),
        when(true, this.props.otherwise ?? new Fragment({})),
      ],
    }).render(s);
  }
}
