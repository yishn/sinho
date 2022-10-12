import type { SignalLike } from "../scope.ts";
import type {
  Renderer,
  RendererNode,
  RendererScope,
  Rendering,
} from "./renderer.ts";
import { Component } from "./component.ts";
import { fragment } from "./fragment.ts";

interface ConditionalProps {
  cases: [condition: SignalLike<boolean>, render: () => Component][];
}

export class Conditional extends Component<ConditionalProps> {
  constructor() {
    super({ cases: [] });
  }

  when(condition: SignalLike<boolean>, render: () => Component): this {
    this.props.cases.push([condition, render]);
    return this;
  }

  otherwise(render: () => Component): this {
    this.props.cases.push([() => true, render]);
    return this;
  }

  render<R extends Renderer>(s: RendererScope<R>): Rendering<R> {
    let firstTime = true;

    const marker = s.renderer.createMarkerNode();
    const rendering: [Rendering<R>, RendererNode<R>] = [[], marker];

    const result = s.memo(() => {
      for (const [condition, render] of this.props.cases) {
        const memoizedCondition = s.memo(() => condition());

        if (memoizedCondition()) {
          return render();
        }
      }

      return fragment();
    });

    s.effect(() => {
      const component = result();

      rendering[0] = component.renderWithDestructor(s)[0];

      if (firstTime) {
        firstTime = false;
      } else {
        s.renderer.insertRendering(rendering[0], marker);
      }
    });

    return rendering;
  }
}

export function conditional(): Conditional {
  return new Conditional();
}
