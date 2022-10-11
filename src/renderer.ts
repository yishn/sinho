import { Scope, Destructor } from "./scope.ts";

export abstract class Renderer<in P = any, in out N = any> {
  abstract createNode(arg: P): N;
  abstract createMarkerNode(): N;
  abstract appendNode(parent: N, node: N): void;
  abstract insertNode(node: N, before: N): void;
  abstract removeNode(node: N): void;

  mount(component: Component<this>, parent: N): Destructor {
    const s = new RendererScope(this);
    const [rendering, destructor] = component.renderWithDestructor(s);

    for (const node of rendering) {
      s.renderer.appendNode(parent, node);
    }

    return destructor;
  }
}

export type RendererNode<R extends Renderer> = R extends Renderer<
  infer _,
  infer N
>
  ? N
  : never;

export class RendererScope<R extends Renderer> extends Scope {
  constructor(public renderer: R) {
    super();
  }
}

export type Rendering<R extends Renderer> =
  | undefined
  | null
  | RendererNode<R>
  | Rendering<R>[];

export type Prop<T> = T | (() => T);

export function getProp<T>(prop: Prop<T>): T {
  if (typeof prop !== "function") return prop;
  return (prop as () => T)();
}

export abstract class Component<R extends Renderer, out P = unknown> {
  constructor(protected props: P) {}

  abstract render(s: RendererScope<R>): Rendering<R>;

  renderNormalized(s: RendererScope<R>): RendererNode<R>[] {
    function normalize(rendering: Rendering<R>): RendererNode<R>[] {
      if (rendering == null) {
        return [];
      } else if (!Array.isArray(rendering)) {
        return [rendering];
      }

      return rendering.flatMap((value) => normalize(value));
    }

    const rendering = normalize(this.render(s));

    if (rendering.length === 0) {
      rendering.push(s.renderer.createMarkerNode());
    }

    return rendering;
  }

  renderWithDestructor(s: RendererScope<R>): [RendererNode<R>[], Destructor] {
    let rendering: RendererNode<R>[] = [];

    const destructor = s.subscope(() => {
      rendering = this.renderNormalized(s);

      s.cleanup(() => {
        for (const node of rendering) {
          s.renderer.removeNode(node);
        }
      });
    });

    return [rendering, destructor];
  }
}

export class Fragment<R extends Renderer> extends Component<R, Component<R>[]> {
  render(s: RendererScope<R>): Rendering<R> {
    return this.props.flatMap((component) => component.render(s));
  }
}

export function fragment<R extends Renderer>(
  components: Component<R>[]
): Fragment<R> {
  return new Fragment(components);
}
