import type { SignalLike } from "../scope.ts";
import type {
  Renderer,
  RendererNode,
  RendererScope,
  Rendering,
} from "./renderer.ts";
import { Component } from "./component.ts";
import { Fragment } from "./fragment.ts";

interface SwitchProps {
  cases: [condition: SignalLike<boolean>, render: () => Component][];
}

export class SwitchComponent extends Component<SwitchProps> {
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

export function Switch(): SwitchComponent {
  return new SwitchComponent();
}
