import {
  Component,
  RendererScope,
  Rendering,
  Fragment,
} from "../renderer/mod.ts";
import type { SignalLike } from "../scope.ts";
import { HtmlNodeType, DomRenderer } from "./mod.ts";
import { ElementMap, setAttr, setStyle } from "./dom.ts";

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
  >]?: SignalLike<string | number | null | undefined> | undefined;
} & {
  [key: string]: SignalLike<string | number | null | undefined> | undefined;
};

type EventMap = ElementEventMap &
  DocumentAndElementEventHandlersEventMap &
  GlobalEventHandlersEventMap;

type EventMapWithTarget<E> = {
  [K in keyof EventMap]: Omit<EventMap[K], "currentTarget"> & {
    currentTarget: E;
  };
};

export type DangerousHtml = SignalLike<{
  __html: string;
}>;

type TagProps<T extends string> = {
  tagName: T;
  style: Style;
  attrs: Record<string, SignalLike<unknown> | undefined>;
  events: Record<
    string | number,
    [listener: (evt: any) => void, opts?: AddEventListenerOptions]
  >;
  children: Fragment;
  dangerouslySetInnerHTML?: DangerousHtml;
};

export class TagComponent<T extends string> extends Component<
  TagProps<T>,
  DomRenderer
> {
  constructor(tagName: T) {
    super({
      tagName,
      style: {},
      attrs: {},
      events: {},
      children: new Fragment({}),
    });
  }

  style(style: Style): this {
    Object.assign(this.props.style, style);
    return this;
  }

  attrs(
    attrs: T extends keyof ElementMap
      ? ElementMap[T][0]
      : Record<string, SignalLike<unknown>>
  ): this {
    Object.assign(this.props.attrs, attrs);
    return this;
  }

  on<K extends keyof EventMap>(
    name: K,
    listener: (
      this: Element,
      evt: EventMapWithTarget<
        T extends keyof ElementMap ? ElementMap[T][1] : Element
      >[K]
    ) => void,
    opts?: AddEventListenerOptions
  ): this {
    this.props.events[name] = [listener, opts];
    return this;
  }

  children(...children: Component[]): this {
    this.props.children = new Fragment({
      children: [this.props.children, ...children],
    });

    return this;
  }

  dangerouslySetInnerHTML(html: DangerousHtml): this {
    this.props.dangerouslySetInnerHTML = html;
    return this;
  }

  render(s: RendererScope<DomRenderer>): Rendering<DomRenderer> {
    const { tagName, style, attrs, events, children } = this.props;
    const prevIsSvg = s.renderer.isSvg;

    if (tagName === "svg") {
      s.renderer.isSvg = true;
    }

    const node = s.renderer.createNode([HtmlNodeType.Element, tagName]) as
      | HTMLElement
      | SVGElement;

    for (const [name, prop] of Object.entries(style)) {
      s.effect(() => {
        setStyle(node, name, prop?.());
      });
    }

    for (const [name, value] of Object.entries(attrs)) {
      s.effect(() => {
        setAttr(node, name, value?.());
      });
    }

    for (const [name, [listener, opts]] of Object.entries(events)) {
      node.addEventListener(name, (evt) => s.batch(() => listener(evt)), opts);
    }

    if (this.props.dangerouslySetInnerHTML != null) {
      s.effect(() => {
        const html = this.props.dangerouslySetInnerHTML!().__html;

        if (node.innerHTML !== html) {
          node.innerHTML = html;
        }
      });
    } else {
      s.renderer.appendRendering(node, children.render(s));
    }

    s.renderer.isSvg = prevIsSvg;

    return [node];
  }
}

export function h<T extends string>(tagName: T): TagComponent<T> {
  return new TagComponent(tagName);
}
