import { Renderer, Component, FunctionComponent } from "../mod.ts";
import { DomIntrinsicElements } from "./dom.ts";
import { DomRenderer } from "./dom_renderer.ts";

export class ServerRendererNode {
  parent?: ServerRendererNode;
  children?: ServerRendererNode[];
  html?: string;

  constructor(public tagName?: string) {}

  toString(): string {
    return this.tagName == null
      ? this.html ?? ""
      : (this.children?.length ?? 0) === 0
      ? `<${this.tagName}/>`
      : `<${this.tagName}>${
          this.children?.map((child) => child.toString()).join("") ?? ""
        }</${this.tagName}>`;
  }
}

export class ServerRenderer extends Renderer<
  DomIntrinsicElements,
  ServerRendererNode
> {
  createIntrinsicComponent<T extends string>(
    name: T,
    props: DomIntrinsicElements[T]
  ): Component {
    return DomRenderer.prototype.createIntrinsicComponent(name, props);
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

  renderToString(component: Component | FunctionComponent<{}>): string {
    const serverNode = new ServerRendererNode("root");
    const destructor = this.mount(component, serverNode);
    const result = (serverNode.children ?? [])
      .map((node) => node.toString())
      .join("");

    destructor();

    return result;
  }
}
