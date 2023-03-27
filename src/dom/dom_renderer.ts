import { Component, Renderer, Scope, Signal } from "../mod.ts";
import { TagComponent } from "./tag.ts";

export class DomRenderer extends Renderer<JSX.IntrinsicElements[string], Node> {
  isSvg = false;

  createSimpleComponent(
    name: string,
    props: JSX.IntrinsicElements[string]
  ): Component<any, this> {
    return new TagComponent({
      tagName: name,
      ...props,
    });
  }

  appendNode(parent: Node, node: Node): void {
    parent.appendChild(node);
  }

  insertNode(node: Node, before: Node): void {
    before.parentNode!.insertBefore(node, before);
  }

  removeNode(node: Node): void {
    try {
      node.parentNode!.removeChild(node);
    } catch (_) {
      // ignore
    }
  }

  nodeRef<E extends Element>(s: Scope): Signal<E | null> {
    return Renderer.prototype.nodeRef.call(this, s);
  }
}
