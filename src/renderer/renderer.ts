import type { Component } from "./component.ts";
import { Scope, Destructor } from "../scope.ts";

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
  | Component<R>
  | Rendering<R>[];
