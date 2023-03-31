import { RendererScope, Rendering, Fragment, Component } from "../mod.ts";
import type { SignalLike } from "../scope.ts";
import { DomRenderer } from "./mod.ts";
import { setAttr, setStyle } from "./dom.ts";

export type TagProps<T extends string> = {
  tagName: T;
} & JSX.IntrinsicElements[T];

export class TagComponent<T extends string> extends Component<
  TagProps<T>,
  DomRenderer
> {
  render(s: RendererScope<DomRenderer>): Rendering<DomRenderer> {
    const { tagName, ref, style, children, dangerouslySetInnerHTML, ...attrs } =
      this.props;
    const prevIsSvg = s.renderer.isSvg;

    if (tagName === "svg") {
      s.renderer.isSvg = true;
    }

    const node = !s.renderer.isSvg
      ? document.createElement(tagName)
      : document.createElementNS("http://www.w3.org/2000/svg", tagName);

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
      s.renderer.appendRendering2(
        new Fragment({
          children: (Array.isArray(children) ? children : [children]).map(
            (child) => {
              if (child instanceof Component) {
                return child;
              } else {
                return new Text({ children: child });
              }
            }
          ),
        }).render(s),
        node
      );
    }

    s.renderer.isSvg = prevIsSvg;

    return new Rendering(s, [node]);
  }
}

export interface TextProps {
  children?: string | number | SignalLike<string | number>;
}

export class Text extends Component<TextProps, DomRenderer> {
  render(s: RendererScope<DomRenderer>): Rendering<DomRenderer> {
    const node = document.createTextNode("");

    s.effect(() => {
      const text =
        typeof this.props.children === "function"
          ? this.props.children().toString()
          : this.props.children?.toString() ?? "";

      if (node.textContent !== text) {
        node.textContent = text;
      }
    });

    return new Rendering(s, [node]);
  }
}
