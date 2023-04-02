import {
  RendererScope,
  Rendering,
  Fragment,
  Component,
  Children,
} from "../mod.ts";
import type { OptionalSignal } from "../scope.ts";
import { DomRenderer } from "./mod.ts";
import { DomChildren, setAttr, setStyle } from "./dom.ts";

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
        setStyle(node, name, s.get(value));
      });
    }

    for (const [name, value] of Object.entries(attrs)) {
      if (name.startsWith("on") && name.length > 2) {
        // Register event

        node.addEventListener(
          name.slice(2),
          s.pin((evt) => {
            s.batch(() => {
              value(evt);
            });
          })
        );
      } else {
        // Set attribute

        s.effect(() => {
          setAttr(node, name, s.get(value));
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
      const fromChildren = (children: DomChildren): Children<DomRenderer> =>
        !Array.isArray(children)
          ? children == null || children instanceof Component
            ? children
            : new Text({ children })
          : children.map(fromChildren);

      s.renderer.appendRendering(
        new Fragment({
          children: fromChildren(children ?? []),
        }).render(s),
        node
      );
    }

    s.renderer.isSvg = prevIsSvg;

    return new Rendering(s, [node]);
  }
}

export interface TextProps {
  children?: OptionalSignal<string | number>;
}

export class Text extends Component<TextProps, DomRenderer> {
  render(s: RendererScope<DomRenderer>): Rendering<DomRenderer> {
    const node = document.createTextNode("");

    s.effect(() => {
      const text = s.get(this.props.children)?.toString() ?? "";

      if (node.textContent !== text) {
        node.textContent = text;
      }
    });

    return new Rendering(s, [node]);
  }
}
