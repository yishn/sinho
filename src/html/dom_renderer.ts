import { ComponentProps } from "../renderer/component.ts";
import {
  Component,
  Renderer,
  RendererScope,
  Rendering,
} from "../renderer/mod.ts";
import { SignalLike } from "../scope.ts";
import { TagProps } from "./mod.ts";
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

    return this.createMarkerNode();
  }

  createMarkerNode(): Node {
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
}

export function h<T extends string>(
  type: T,
  props: Omit<TagProps<T>, "tagName">,
  ...children: Component<any, DomRenderer>[]
): TagComponent<T>;
export function h<T extends new (props: any) => Component<any, DomRenderer>>(
  type: T,
  props: ComponentProps<InstanceType<T>>,
  ...children:
    | (NonNullable<ComponentProps<InstanceType<T>>["children"]> & any[])
    | []
): InstanceType<T>;
export function h(
  type: string | (new (props: any) => Component<any, DomRenderer>),
  props: any,
  ...children: any[]
): Component<any, DomRenderer> {
  if (children.length === 1) children = children[0];

  if (typeof type === "string") {
    return new TagComponent({ tagName: type, children, ...props });
  } else {
    return new type({ children, ...props });
  }
}
