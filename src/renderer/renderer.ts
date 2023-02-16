import { Component, ComponentProps, flattenRendering } from "./component.ts";
import { Scope, Destructor } from "../scope.ts";

type RenderingWithNode<N> = (N | RenderingWithNode<N>)[];

export type Rendering<R extends Renderer> = RenderingWithNode<RendererNode<R>>;

export type RendererNode<R extends Renderer> = R extends Renderer<
  infer _,
  infer N
>
  ? N
  : never;

export abstract class Renderer<in P = any, out N extends object = any> {
  abstract createNode(arg: P): N;
  abstract createMarkerNode(): N;

  abstract appendNode(parent: N, node: N): void;
  abstract insertNode(node: N, before: N): void;
  abstract removeNode(node: N): void;

  appendRendering(parent: N, rendering: RenderingWithNode<N>): void {
    for (const node of flattenRendering(rendering)) {
      this.appendNode(parent, node);
    }
  }

  insertRendering(rendering: RenderingWithNode<N>, before: N): void {
    for (const node of flattenRendering(rendering)) {
      this.insertNode(node, before);
    }
  }

  removeRendering(rendering: RenderingWithNode<N>): void {
    for (const node of flattenRendering(rendering)) {
      this.removeNode(node);
    }
  }
}

export function mount<R extends Renderer>(
  renderer: R,
  component: Component<any, R>,
  parent: RendererNode<R>
): Destructor {
  const s = new RendererScope(renderer);
  const [rendering, destructor] = component.createRenderingWithDestructor(s);

  s.renderer.appendRendering(parent, rendering);

  return destructor;
}

export function h<
  R extends Renderer,
  T extends new (props: any) => Component<any, R>
>(
  Component: T,
  props: ComponentProps<InstanceType<T>>,
  ...children:
    | (NonNullable<ComponentProps<InstanceType<T>>["children"]> & any[])
    | []
): InstanceType<T> {
  return new Component({ children, ...props }) as InstanceType<T>;
}

export class RendererScope<out R extends Renderer> extends Scope {
  constructor(public renderer: R) {
    super();
  }
}
