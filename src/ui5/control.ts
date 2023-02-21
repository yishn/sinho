import { Component, RendererScope, Rendering } from "../renderer/mod.ts";
import { OptionalSignal } from "../scope.ts";
import {
  Ui5Renderer,
  Ui5ControlConstructor,
  Ui5Node,
  Ui5NodeType,
} from "./ui5_renderer.ts";
import { capitalize, sapRequireControl } from "./utils.ts";

export type ControlProps = {
  Control: Ui5ControlConstructor;
  id?: string;
  class?: OptionalSignal<string>;
  children?: Component<any, Ui5Renderer> | Component<any, Ui5Renderer>[];
};

export class Control<P> extends Component<ControlProps & P, Ui5Renderer> {
  static async fromUi5Control<P>(
    path: string
  ): Promise<
    new (props: Omit<ControlProps, "Control"> & P) => Component<
      any,
      Ui5Renderer
    >
  > {
    const RequiredControl = await sapRequireControl(path);

    return class extends Control<P> {
      constructor(props: Omit<ControlProps, "Control"> & P) {
        super({
          ...props,
          Control: RequiredControl,
        });
      }
    };
  }

  render(_: RendererScope<Ui5Renderer>): Component<any, Ui5Renderer> {
    throw new Error("unimplemented");
  }

  reify(s: RendererScope<Ui5Renderer>): Rendering<Ui5Renderer> {
    const { Control, id, class: classNames, children, ...props } = this.props;
    const control = new Control(id);

    const node: Ui5Node = {
      type: Ui5NodeType.Control,
      control,
    };

    let prevClassNames: string | undefined;

    s.effect(() => {
      const evaluatedClassNames = s.memo(() =>
        typeof classNames === "string" ? classNames : classNames?.()
      );

      if (prevClassNames != null) {
        control.removeStyleClass(prevClassNames);
      }

      if (evaluatedClassNames() != null) {
        control.addStyleClass(evaluatedClassNames()!);
      }

      prevClassNames = evaluatedClassNames();
    });

    for (const [prop, value] of Object.entries(props)) {
      if (prop.startsWith("on") && typeof value === "function") {
        // Register event

        // @ts-ignore
        control[`attach${prop.slice(2)}`]((evt) => {
          s.batch(() => value(evt));
        });
      } else {
        // Set property

        s.effect(() => {
          control[`set${capitalize(prop)}`](
            typeof value === "function" && value.length === 0 ? value() : value
          );
        });
      }
    }

    for (const child of [this.props.children ?? []].flat(1)) {
      s.renderer.appendRendering(child.reify(s), node);
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
      s.renderer.appendRendering(child.reify(s), node);
    }

    return [node];
  }
}
