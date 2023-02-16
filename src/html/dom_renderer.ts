import { ComponentProps } from "../renderer/component.ts";
import { Component, Renderer } from "../renderer/mod.ts";
import { Scope, Signal, SignalSetter } from "../scope.ts";
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
  private nodeRefsBySignal = new WeakMap<
    Signal<Element | null>,
    SignalSetter<Element | null>
  >();
  private nodeRefsByElement = new WeakMap<
    Element,
    SignalSetter<Element | null>
  >();

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

    this.nodeRefsByElement.get(node as Element)?.(node as Element);
  }

  insertNode(node: Node, before: Node): void {
    before.parentNode!.insertBefore(node, before);

    this.nodeRefsByElement.get(node as Element)?.(node as Element);
  }

  removeNode(node: Node): void {
    try {
      node.parentNode!.removeChild(node);

      this.nodeRefsByElement.get(node as Element)?.(null);
    } catch (_) {
      // ignore
    }
  }

  nodeRef<E extends Element>(s: Scope): Signal<E | null> {
    const [signal, setSignal] = s.signal<Element | null>(null);

    this.nodeRefsBySignal.set(signal, setSignal);

    return signal as Signal<E | null>;
  }

  linkNodeRef(element: Element, signal: Signal<Element | null>): void {
    const setter = this.nodeRefsBySignal.get(signal);

    if (setter != null) {
      this.nodeRefsByElement.set(element, setter);
    }
  }
}

export function h<T extends keyof JSX.IntrinsicElements>(
  type: T,
  props: JSX.IntrinsicElements[T],
  ...children: Component<any, DomRenderer>[]
): TagComponent<T & string>;
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
