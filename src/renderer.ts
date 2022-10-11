import { Scope } from "./scope.ts";

export abstract class Renderer<in T = any, in out N = any> {
  abstract createNode(arg: T): N;
  abstract createMarkerNode(): N;
  abstract appendNode(parent: N, node: N): void;
  abstract insertNode(node: N, before: N): void;
  abstract removeNode(node: N): void;
}

export type RendererNode<R> = R extends Renderer<infer _, infer N> ? N : never;

export class RendererScope<R extends Renderer> extends Scope {
  constructor(public renderer: R) {
    super();
  }
}

export type Rendering<R> =
  | undefined
  | null
  | RendererNode<R>
  | RendererNode<R>[];

export abstract class Component<R extends Renderer> {
  abstract render(s: RendererScope<R>): Rendering<R>;
}
