import { Component, RendererScope, Rendering } from "../renderer/mod.ts";
import { SignalLike } from "../scope.ts";
import { Ui5Control, Ui5Renderer } from "./mod.ts";
import { Ui5Node, Ui5NodeType } from "./ui5_renderer.ts";
import { capitalize } from "./utils.ts";

export type ControlProps = {
  Control: new () => Ui5Control;
  children?: Component<any, Ui5Renderer> | Component<any, Ui5Renderer>[];
  [_: string]: any;
};

export class Control extends Component<ControlProps, Ui5Renderer> {
  render(_: RendererScope<Ui5Renderer>): Component<any, Ui5Renderer> {
    throw new Error("unimplemented");
  }

  reify(s: RendererScope<Ui5Renderer>): Rendering<Ui5Renderer> {
    const { Control, children, ...props } = this.props;
    const control = new Control();

    const node: Ui5Node = {
      type: Ui5NodeType.Control,
      control,
    };

    for (const [prop, value] of Object.entries(props)) {
      if (prop.startsWith("on")) {
        // Register event

        // @ts-ignore
        control[`attach${prop.slice(2)}`]((evt) => {
          s.batch(() => value(evt));
        });
      } else {
        // Set property

        s.effect(() => {
          control[`set${capitalize(prop)}`]((value as SignalLike<unknown>)());
        });
      }
    }

    for (const child of [this.props.children ?? []].flat(1)) {
      s.renderer.appendRendering(node, child.reify(s));
    }

    return [node];
  }
}

export interface AggregationProps {
  name: string;
  children?: Component<any, Ui5Renderer> | Component<any, Ui5Renderer>[];
}

export class Aggregation extends Component<AggregationProps, Ui5Renderer> {
  render(_: RendererScope<Ui5Renderer>): Component<any, Ui5Renderer> {
    throw new Error("unimplemented");
  }

  reify(s: RendererScope<Ui5Renderer>): Rendering<Ui5Renderer> {
    const node: Ui5Node = {
      type: Ui5NodeType.Aggregation,
      name: this.props.name,
    };

    for (const child of [this.props.children ?? []].flat(1)) {
      s.renderer.appendRendering(node, child.reify(s));
    }

    return [node];
  }
}
