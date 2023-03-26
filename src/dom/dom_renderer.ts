import {
  ComponentProps,
  FunctionComponent,
  FunctionComponentWrapper,
  Component,
  Renderer,
  Scope,
  Signal,
} from "../mod.ts";
import type { ShingoProps } from "./dom.ts";
import { TagComponent } from "./tag.ts";

export enum HtmlNodeType {
  Element,
  Text,
}

export type CreateNodeArg =
  | [type: HtmlNodeType.Element, tagName: string]
  | [type: HtmlNodeType.Text, content: string];

export class DomRenderer extends Renderer<CreateNodeArg, Node> {
  isSvg = false;

  createNode([type, arg]: CreateNodeArg): Node {
    if (type === HtmlNodeType.Element) {
      return !this.isSvg
        ? document.createElement(arg)
        : document.createElementNS("http://www.w3.org/2000/svg", arg);
    } else if (type === HtmlNodeType.Text) {
      return document.createTextNode(arg);
    }

    return document.createComment("");
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

export function h<T extends keyof JSX.IntrinsicElements>(
  type: T,
  props?: JSX.IntrinsicElements[T] | null,
  ...children: Extract<ShingoProps<never>["children"], unknown[]>
): TagComponent<T & string>;
export function h<T extends new (props: any) => Component<any, DomRenderer>>(
  type: T,
  props?: ComponentProps<InstanceType<T>> | null,
  ...children: Extract<ShingoProps<never>["children"], unknown[]>
): InstanceType<T>;
export function h<T extends FunctionComponent<any, DomRenderer>>(
  type: T,
  props?: ComponentProps<T> | null,
  ...children: Extract<ShingoProps<never>["children"], unknown[]>
): ReturnType<T>;
export function h(
  type: any,
  props: any,
  ...children: any[]
): Component<any, DomRenderer> {
  if (children.length === 1) children = children[0];

  if (typeof type === "string") {
    return new TagComponent({ tagName: type, children, ...props });
  } else if (type.isClassComponent) {
    return new type({ children, ...props });
  } else {
    return new FunctionComponentWrapper<any, DomRenderer>(
      { children, ...props },
      type
    );
  }
}
