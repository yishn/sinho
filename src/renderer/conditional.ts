import type { SignalLike } from "../scope.ts";
import type { Renderer, RendererScope, Rendering } from "./renderer.ts";
import { Component } from "./component.ts";
import { fragment } from "./fragment.ts";

interface ConditionalProps<R extends Renderer> {
  cases: [condition: SignalLike<boolean>, render: () => Component<R>][];
}

export class Conditional<R extends Renderer> extends Component<
  R,
  ConditionalProps<R>
> {
  constructor() {
    super({ cases: [] });
  }

  when(condition: SignalLike<boolean>, render: () => Component<R>): this {
    this.props.cases.push([condition, render]);
    return this;
  }

  otherwise(render: () => Component<R>): this {
    this.props.cases.push([() => true, render]);
    return this;
  }

  render(s: RendererScope<R>): Rendering<R> {
    let firstTime = true;

    const marker = s.renderer.createMarkerNode();

    const result = s.memo(() => {
      for (const [condition, render] of this.props.cases) {
        const memoizedCondition = s.memo(() => condition());

        if (memoizedCondition()) {
          return render().renderWithDestructor(s);
        }
      }

      return fragment().renderWithDestructor(s);
    });

    s.effect(() => {
      const [rendering, destructor] = result();

      if (firstTime) {
        firstTime = false;
      } else {
        for (const node of rendering) {
          s.renderer.insertNode(node, marker);
        }
      }

      s.cleanup(() => destructor());
    });

    return [result()[0], marker];
  }
}

export function conditional<R extends Renderer>(): Conditional<R> {
  return new Conditional();
}
