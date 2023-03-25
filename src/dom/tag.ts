import { RendererScope, Rendering, Fragment, Component } from "../mod.ts";
import type { SignalLike } from "../scope.ts";
import { HtmlNodeType, DomRenderer, DomComponent } from "./mod.ts";
import { setAttr, setStyle } from "./dom.ts";

export type TagProps<T extends string> = {
  tagName: T;
} & JSX.IntrinsicElements[T];

export class TagComponent<T extends string> extends DomComponent<TagProps<T>> {
  render(_: RendererScope<DomRenderer>): never {
    throw new Error("unimplemented");
  }

  reify(s: RendererScope<DomRenderer>): Rendering<DomRenderer> {
    const { tagName, ref, style, children, dangerouslySetInnerHTML, ...attrs } =
      this.props;
    const prevIsSvg = s.renderer.isSvg;

    if (tagName === "svg") {
      s.renderer.isSvg = true;
    }

    const node = s.renderer.createNode([HtmlNodeType.Element, tagName]) as
      | HTMLElement
      | SVGElement;

    if (ref != null) {
      s.renderer.linkNodeRef(ref, node);
    }

    for (const [name, value] of Object.entries(style ?? {})) {
      s.effect(() => {
        setStyle(node, name, typeof value === "function" ? value() : value);
      });
    }

    for (const [name, value] of Object.entries(attrs)) {
      if (name.startsWith("on") && name.length > 2) {
        // Register event

        node.addEventListener(name.slice(2), (evt) =>
          s.batch(() => value(evt))
        );
      } else {
        // Set attribute

        s.effect(() => {
          setAttr(
            node,
            name,
            typeof value === "function" && value.length === 0 ? value() : value
          );
        });
      }
    }

    if (dangerouslySetInnerHTML != null) {
      s.effect(() => {
        const html = dangerouslySetInnerHTML!().__html;

        if (node.innerHTML !== html) {
          node.innerHTML = html;
        }
      });
    } else {
      s.renderer.appendRendering(
        new Fragment({
          children: [children].flat(1).map((child) => {
            if (child instanceof Component) {
              return child;
            } else {
              return new Text({ children: child });
            }
          }),
        }).reify(s),
        node
      );
    }

    s.renderer.isSvg = prevIsSvg;

    return [node];
  }
}

interface TextProps {
  children?: string | number | SignalLike<string | number>;
}

export class Text extends DomComponent<TextProps> {
  render(_: RendererScope<DomRenderer>): never {
    throw new Error("unimplemented");
  }

  reify(s: RendererScope<DomRenderer>): Rendering<DomRenderer> {
    const node = s.renderer.createNode([HtmlNodeType.Text, ""]);

    s.effect(() => {
      const text =
        typeof this.props.children === "function"
          ? this.props.children().toString()
          : this.props.children?.toString() ?? "";

      if (node.textContent !== text) {
        node.textContent = text;
      }
    });

    return [node];
  }
}
