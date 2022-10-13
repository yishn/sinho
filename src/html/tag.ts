import {
  Component,
  implRender,
  SpecificComponent,
} from "../renderer/component.ts";
import { Fragment, FragmentComponent } from "../renderer/fragment.ts";
import { SignalLike } from "../scope.ts";
import { HtmlNodeType, HtmlRenderer } from "./mod.ts";
import { setAttr, setStyle } from "./dom.ts";

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
  GlobalEventHandlersEventMap & {
    [key: string]: (evt: any) => void;
  };

export interface DangerousHtml {
  __html: SignalLike<string>;
}

type TagProps<T extends string> = {
  tagName: T;
  style: Style;
  attrs: Record<string, SignalLike<unknown> | undefined>;
  events: Record<
    string | number,
    [listener: (evt: any) => void, opts?: AddEventListenerOptions]
  >;
  children: FragmentComponent;
  dangerouslySetInnerHTML?: DangerousHtml;
};

export class TagComponent<T extends string> extends SpecificComponent<
  TagProps<T>
> {
  constructor(tagName: T) {
    super({
      tagName,
      style: {},
      attrs: {},
      events: {},
      children: Fragment(),
    });
  }

  style(style: Style): this {
    Object.assign(this.props.style, style);
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

  children(...children: Component[]): this {
    this.props.children = Fragment(this.props.children, ...children);
    return this;
  }

  dangerouslySetInnerHTML(html: DangerousHtml): this {
    this.props.dangerouslySetInnerHTML = html;
    return this;
  }
}

implRender(TagComponent<string>, HtmlRenderer, (s, props) => {
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

  if (props.dangerouslySetInnerHTML != null) {
    s.effect(() => {
      const html = props.dangerouslySetInnerHTML!.__html();

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

export function h<T extends string>(tagName: T): TagComponent<T> {
  return new TagComponent(tagName);
}
