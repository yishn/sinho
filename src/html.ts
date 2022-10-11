import {
  Component,
  fragment,
  Fragment,
  getProp,
  Prop,
  Renderer,
  RendererScope,
  Rendering,
} from "./renderer.ts";

/*
 * The following functions are lifted from Preact <https://preactjs.com/> and
 * modified.
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2015-present Jason Miller
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const IS_NON_DIMENSIONAL =
  /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;

function setStyle(
  node: ElementCSSInlineStyle,
  key: any,
  value: string | number | null | undefined
): void {
  if (key[0] === "-") {
    node.style.setProperty(key, `${value}`);
  } else if (value == null) {
    node.style[key] = "";
  } else if (typeof value !== "number" || IS_NON_DIMENSIONAL.test(key)) {
    node.style[key] = `${value}`;
  } else {
    node.style[key] = `${value}px`;
  }
}

function setAttr(node: any, name: string, value: unknown): void {
  if (name !== "innerHTML") {
    if (
      name !== "href" &&
      name !== "list" &&
      name !== "form" &&
      // Default value in browsers is `-1` and an empty string is
      // cast to `0` instead
      name !== "tabIndex" &&
      name !== "download" &&
      name in node
    ) {
      try {
        node[name] = value == null ? "" : value;
        return;
      } catch (e) {}
    }

    // ARIA-attributes have a different notion of boolean values.
    // The value `false` is different from the attribute not
    // existing on the DOM, so we can't remove it. For non-boolean
    // ARIA-attributes we could treat false as a removal, but the
    // amount of exceptions would cost us too many bytes. On top of
    // that other VDOM frameworks also always stringify `false`.

    if (typeof value === "function") {
      // never serialize functions as attribute values
    } else if (value != null && (value !== false || name.indexOf("-") != -1)) {
      node.setAttribute(name, value);
    } else {
      node.removeAttribute(name);
    }
  }
}

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
    node.parentNode!.removeChild(node);
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
  >]?: Prop<string | number | null | undefined>;
} & {
  [key: string]: Prop<string | number | null | undefined>;
};

type EventMap = ElementEventMap &
  DocumentAndElementEventHandlersEventMap &
  GlobalEventHandlersEventMap & {
    [key: string]: (evt: any) => void;
  };

export interface DangerousHtml {
  __html: string;
}

export type TagProps<T extends string> = {
  tagName: T;
  style?: Style;
  attrs?: Record<string, Prop<unknown>>;
  events?: Record<
    string | number,
    [listener: (evt: any) => void, opts?: AddEventListenerOptions]
  >;
  children?: Fragment<HtmlRenderer> | DangerousHtml;
};

export class Tag<T extends string> extends Component<
  HtmlRenderer,
  TagProps<T>
> {
  style(style: Style): this {
    this.props.style = style;
    return this;
  }

  attr(key: string, value: Prop<unknown>): this {
    if (this.props.attrs == null) this.props.attrs = {};
    this.props.attrs[key] = value;
    return this;
  }

  on<K extends keyof EventMap>(
    name: K,
    listener: (this: Element, evt: EventMap[K]) => void,
    opts?: AddEventListenerOptions
  ): this {
    if (this.props.events == null) this.props.events = {};
    this.props.events[name] = [listener, opts];
    return this;
  }

  children(children: Component<HtmlRenderer>[] | DangerousHtml): this {
    this.props.children = "__html" in children ? children : fragment(children);
    return this;
  }

  render(s: RendererScope<HtmlRenderer>): Rendering<HtmlRenderer> {
    const {
      tagName,
      style = {},
      attrs = {},
      events = {},
      children = fragment([]),
    } = this.props;

    const prevIsSvg = s.renderer.isSvg;
    if (tagName === "svg") {
      s.renderer.isSvg = true;
    }

    const node = s.renderer.createNode([HtmlNodeType.Element, tagName]) as
      | HTMLElement
      | SVGElement;

    for (const [name, prop] of Object.entries(style)) {
      s.effect(() => {
        setStyle(node, name, getProp(prop));
      });
    }

    for (const [name, value] of Object.entries(attrs)) {
      s.effect(() => {
        setAttr(node, name, getProp(value));
      });
    }

    for (const [name, [listener, opts]] of Object.entries(events)) {
      node.addEventListener(name, listener, opts);
    }

    if ("__html" in children) {
      node.innerHTML = children.__html;
    } else {
      for (const child of children.renderNormalized(s) ?? []) {
        s.renderer.appendNode(node, child);
      }
    }

    s.renderer.isSvg = prevIsSvg;

    return node;
  }
}

export function h<T extends string>(tagName: T): Tag<T> {
  return new Tag({ tagName });
}

export class Text extends Component<HtmlRenderer, Prop<string>> {
  render(s: RendererScope<HtmlRenderer>): Rendering<HtmlRenderer> {
    const node = s.renderer.createNode([HtmlNodeType.Text, ""]);

    s.effect(() => {
      let text = getProp(this.props);

      if (node.textContent !== text) {
        node.textContent = text;
      }
    });

    return node;
  }
}

export function text(value: Prop<string>): Text {
  return new Text(value);
}
