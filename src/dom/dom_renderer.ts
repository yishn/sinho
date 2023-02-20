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

  private _nodeRefSignals = new WeakMap<
    Signal<Node | null>,
    SignalSetter<Node | null>
  >();
  private _elementNodeRefSetters = new WeakMap<
    Node,
    SignalSetter<Node | null>
  >();

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

    this._elementNodeRefSetters.get(node)?.(node);
  }

  insertNode(node: Node, before: Node): void {
    before.parentNode!.insertBefore(node, before);

    this._elementNodeRefSetters.get(node)?.(node);
  }

  removeNode(node: Node): void {
    try {
      node.parentNode!.removeChild(node);

      this._elementNodeRefSetters.get(node)?.(null);
    } catch (_) {
      // ignore
    }
  }

  nodeRef<E extends Element>(s: Scope): Signal<E | null> {
    const [signal, setSignal] = s.signal<Node | null>(null);

    this._nodeRefSignals.set(signal, setSignal);

    return signal as Signal<E | null>;
  }

  linkNodeRef(element: Element, signal: Signal<Element | null>): void {
    const setter = this._nodeRefSignals.get(signal);

    if (setter != null) {
      this._elementNodeRefSetters.set(element, setter);
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
  ...children: Component<any, DomRenderer>[]
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
