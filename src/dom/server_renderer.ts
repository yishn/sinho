import { Renderer, Component } from "../mod.ts";
import { DomIntrinsicElements } from "./dom.ts";
import { TagComponent } from "./tag.ts";

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

export class ServerRenderer extends Renderer<
  DomIntrinsicElements,
  ServerRendererNode
> {
  createIntrinsicComponent<T extends string>(
    name: T,
    props: DomIntrinsicElements[T]
  ): Component {
    return new TagComponent({
      ...props,
      tagName: name,
    });
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
