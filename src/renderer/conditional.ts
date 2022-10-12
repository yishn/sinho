import type { Signal, SignalLike } from "../scope.ts";
import type {
  Renderer,
  RendererNode,
  RendererScope,
  Rendering,
} from "./renderer.ts";
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

  render(s: RendererScope<R>): Signal<Rendering<R>> {
    let firstTime = true;

    const marker = s.renderer.createMarkerNode();
    const [rendering, setRendering] = s.signal<Rendering<R>[]>([null, marker]);

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
      const rendering = component.renderWithDestructor(s)[0];

      s.effect(() => {
        setRendering((value) => [rendering(), value[1]]);
      });

      if (firstTime) {
        firstTime = false;
      } else {
        for (const node of rendering.peek()) {
          s.renderer.insertNode(node, marker);
        }
      }
    });

    return rendering;
  }
}

export function conditional<R extends Renderer>(): Conditional<R> {
  return new Conditional();
}
