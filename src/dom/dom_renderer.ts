import { Component, Renderer, Scope, Signal } from "../mod.ts";
import type { DomIntrinsicElements } from "./dom.ts";
import { TagComponent } from "./tag.ts";

export class DomRenderer extends Renderer<DomIntrinsicElements, Node> {
  isSvg = false;

  createIntrinsicComponent<T extends keyof DomIntrinsicElements>(
    name: T & string,
    props: DomIntrinsicElements[T]
  ): Component<any, this> {
    return new TagComponent({
      tagName: name,
      ...props,
    }) as Component<any, this>;
  }

  appendNode(parent: Node, node: Node): void {
    parent.appendChild(node);
  }

  insertNode(node: Node, before: Node): void {
    if (before.parentNode != null) {
      before.parentNode.insertBefore(node, before);
    }
  }

  removeNode(node: Node): void {
    try {
      if (node.parentNode != null) {
        node.parentNode.removeChild(node);
      }
    } catch (_) {
      // ignore
    }
  }

  nodeRef<E extends Element>(s: Scope): Signal<E | null> {
    return Renderer.prototype.nodeRef.call(this, s);
  }
}
