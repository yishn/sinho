import {
  Fragment,
  Renderer,
  Children,
  Component,
  RendererScope,
  Rendering,
  OptionalSignal,
} from "../mod.ts";
import { DomIntrinsicElements } from "./dom.ts";

export class ServerRendererNode {
  parent?: ServerRendererNode;
  children?: ServerRendererNode[];
  html?: string;

  constructor(public tagName?: string) {}

  toString(): string {
    return this.tagName == null
      ? this.html ?? ""
      : `<${this.tagName}>${
          this.children?.map((child) => child.toString()) ?? ""
        }</${this.tagName}>`;
  }
}

type ServerChildren =
  | null
  | undefined
  | Component<any, ServerRenderer>
  | OptionalSignal<string | number>
  | ServerChildren[];

class Text extends Component<
  { children: OptionalSignal<string | number> },
  ServerRenderer
> {
  render(s: RendererScope<ServerRenderer>): Rendering<ServerRenderer> {
    const node = new ServerRendererNode();
    node.html = s.get(`${this.props.children}` ?? "");
    return new Rendering(s, [node]);
  }
}

class IntrinsicComponent extends Component<
  { tagName: string; children: ServerChildren } & Omit<
    DomIntrinsicElements[any],
    "children"
  >,
  ServerRenderer
> {
  render(s: RendererScope<ServerRenderer>): Rendering<ServerRenderer> {
    const node = new ServerRendererNode(this.props.tagName);

    const fromChildren = (children: ServerChildren): Children<ServerRenderer> =>
      !Array.isArray(children)
        ? children == null || children instanceof Component
          ? children
          : new Text({ children })
        : children.map(fromChildren);

    s.renderer.appendRendering(
      new Fragment({ children: fromChildren(this.props.children) }).render(s),
      node
    );

    return new Rendering(s, [node]);
  }
}

export class ServerRenderer extends Renderer<
  DomIntrinsicElements,
  ServerRendererNode
> {
  createIntrinsicComponent<T extends string>(
    name: T,
    props: { children: ServerChildren } & Omit<
      DomIntrinsicElements[T],
      "children"
    >
  ): Component<any, this> {
    return new IntrinsicComponent({
      ...props,
      tagName: name,
    }) as Component<any, this>;
  }

  appendNode(parent: ServerRendererNode, node: ServerRendererNode): void {
    node.parent = parent;
    (parent.children ??= []).push(node);
  }

  insertNode(node: ServerRendererNode, before: ServerRendererNode): void {
    if (node.parent != null) {
      const index = node.parent.children?.indexOf(before) ?? -1;

      if (index >= 0) {
        node.parent.children!.splice(index, 0, node);
      }
    }
  }

  removeNode(node: ServerRendererNode): void {
    if (node.parent != null) {
      const index = node.parent.children?.indexOf(node) ?? -1;

      if (index >= 0) {
        node.parent.children!.splice(index, 1);
      }
    }
  }
}
