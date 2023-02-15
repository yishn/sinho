import {
  Component,
  Renderer,
  RendererScope,
  Rendering,
} from "../renderer/mod.ts";
import { SignalLike } from "../scope.ts";

export enum HtmlNodeType {
  Element,
  Text,
}

export type CreateNodeArg =
  | [type: HtmlNodeType.Element, tagName: string]
  | [type: HtmlNodeType.Text, content: string];

export class DomRenderer extends Renderer<CreateNodeArg, Node> {
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
    before.parentNode!.insertBefore(node, before);
  }

  removeNode(node: Node): void {
    try {
      node.parentNode!.removeChild(node);
    } catch (err) {
      // ignore
    }
  }
}

interface TextComponentProps {
  value: SignalLike<string | number>;
}

export class TextComponent extends Component<TextComponentProps, DomRenderer> {
  render(s: RendererScope<DomRenderer>): Rendering<DomRenderer> {
    const node = s.renderer.createNode([HtmlNodeType.Text, ""]);

    s.effect(() => {
      let text = this.props.value().toString();

      if (node.textContent !== text) {
        node.textContent = text;
      }
    });

    return [node];
  }
}

export function text(
  value: string | number | SignalLike<string | number>
): TextComponent {
  return new TextComponent({
    value: typeof value === "function" ? value : () => value,
  });
}
