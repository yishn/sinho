import {
  Renderer,
  RendererScope,
  Rendering,
  Component,
  fragment,
  Fragment,
  SpecificComponent,
  implRender,
} from "../renderer/mod.ts";
import { setAttr, setStyle } from "./dom.ts";
import { SignalLike } from "../scope.ts";

/*
 * Preact code end
 */

export enum HtmlNodeType {
  Element,
  Text,
}

export type CreateNodeArg =
  | [type: HtmlNodeType.Element, tagName: string]
  | [type: HtmlNodeType.Text, content: string];

export class HtmlRenderer extends Renderer<CreateNodeArg, Node> {
  isSvg: boolean = false;

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
    node.parentNode!.insertBefore(node, before);
  }

  removeNode(node: Node): void {
    try {
      node.parentNode!.removeChild(node);
    } catch (err) {
      // ignore
    }
  }
}

export type Style = {
  [K in Exclude<
    keyof CSSStyleDeclaration,
    | "item"
    | "setProperty"
    | "removeProperty"
    | "getPropertyValue"
    | "getPropertyPriority"
    | typeof Symbol.iterator
    | number
  >]?: SignalLike<string | number | null | undefined>;
} & {
  [key: string]: SignalLike<string | number | null | undefined>;
};

type EventMap = ElementEventMap &
  DocumentAndElementEventHandlersEventMap &
  GlobalEventHandlersEventMap & {
    [key: string]: (evt: any) => void;
  };

export interface DangerousHtml {
  __html: SignalLike<string>;
}

type TagProps<T extends string> = {
  tagName: T;
  style: Style;
  attrs: Record<string, SignalLike<unknown>>;
  events: Record<
    string | number,
    [listener: (evt: any) => void, opts?: AddEventListenerOptions]
  >;
  children: Fragment | DangerousHtml;
};

export class Tag<T extends string> extends SpecificComponent<TagProps<T>> {
  constructor(tagName: T) {
    super({
      tagName,
      style: {},
      attrs: {},
      events: {},
      children: fragment(),
    });
  }

  style(style: Style): this {
    this.props.style = style;
    return this;
  }

  attrs(attrs: Record<string, SignalLike<unknown>>): this {
    Object.assign(this.props.attrs, attrs);
    return this;
  }

  on<K extends keyof EventMap>(
    name: K,
    listener: (this: Element, evt: EventMap[K]) => void,
    opts?: AddEventListenerOptions
  ): this {
    this.props.events[name] = [listener, opts];
    return this;
  }

  children(...children: Component[]): this;
  children(html: DangerousHtml): this;
  children(...children: (Component | DangerousHtml)[]): this {
    this.props.children =
      children[0] != null && "__html" in children[0]
        ? children[0]
        : fragment(...(children as Component[]));
    return this;
  }
}

implRender(Tag<string>, HtmlRenderer, (s, props) => {
  const { tagName, style, attrs, events, children } = props;
  const prevIsSvg = s.renderer.isSvg;

  if (tagName === "svg") {
    s.renderer.isSvg = true;
  }

  const node = s.renderer.createNode([HtmlNodeType.Element, tagName]) as
    | HTMLElement
    | SVGElement;

  for (const [name, prop] of Object.entries(style)) {
    s.effect(() => {
      setStyle(node, name, prop());
    });
  }

  for (const [name, value] of Object.entries(attrs)) {
    s.effect(() => {
      setAttr(node, name, value());
    });
  }

  for (const [name, [listener, opts]] of Object.entries(events)) {
    node.addEventListener(name, listener, opts);
  }

  if ("__html" in children) {
    s.effect(() => {
      const html = children.__html();

      if (node.innerHTML !== html) {
        node.innerHTML = html;
      }
    });
  } else {
    s.renderer.appendRendering(node, children.render(s));
  }

  s.renderer.isSvg = prevIsSvg;

  return [node];
});

export function h<T extends string>(tagName: T): Tag<T> {
  return new Tag(tagName);
}

interface ToString {
  toString(): string;
}

export class Text extends SpecificComponent<SignalLike<ToString>> {}

implRender(Text, HtmlRenderer, (s, props) => {
  const node = s.renderer.createNode([HtmlNodeType.Text, ""]);

  s.effect(() => {
    let text = props().toString();

    if (node.textContent !== text) {
      node.textContent = text;
    }
  });

  return [node];
});

export function text(
  value: string | number | SignalLike<string | number>
): Text {
  return new Text(typeof value === "function" ? value : () => value);
}
