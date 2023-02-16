import {
  Component,
  RendererScope,
  Rendering,
  Fragment,
} from "../renderer/mod.ts";
import type { SignalLike } from "../scope.ts";
import { HtmlNodeType, DomRenderer } from "./mod.ts";
import { setAttr, setStyle } from "./dom.ts";

export type DangerousHtml = SignalLike<{
  __html: string;
}>;

export type TagProps<T extends string> = {
  tagName: T;
} & JSX.IntrinsicElements[T];

export class TagComponent<T extends string> extends Component<
  TagProps<T>,
  DomRenderer
> {
  render(s: RendererScope<DomRenderer>): Rendering<DomRenderer> {
    const { tagName, style, children, ...attrs } = this.props;
    this.props.tagName;
    const prevIsSvg = s.renderer.isSvg;

    if (tagName === "svg") {
      s.renderer.isSvg = true;
    }

    const node = s.renderer.createNode([HtmlNodeType.Element, tagName]) as
      | HTMLElement
      | SVGElement;

    for (const [name, prop] of Object.entries(style ?? {})) {
      s.effect(() => {
        setStyle(node, name, prop?.());
      });
    }

    for (const [name, value] of Object.entries(attrs)) {
      if (name.startsWith("on") && name.length > 2) {
        node.addEventListener(name.slice(2).toLowerCase(), (evt) =>
          s.batch(() => value(evt))
        );
      } else {
        s.effect(() => {
          setAttr(node, name, value?.());
        });
      }
    }

    if (this.props.dangerouslySetInnerHTML != null) {
      s.effect(() => {
        const html = this.props.dangerouslySetInnerHTML!().__html;

        if (node.innerHTML !== html) {
          node.innerHTML = html;
        }
      });
    } else {
      s.renderer.appendRendering(
        node,
        new Fragment({ children }).createRendering(s)
      );
    }

    s.renderer.isSvg = prevIsSvg;

    return [node];
  }
}
