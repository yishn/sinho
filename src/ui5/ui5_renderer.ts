import {
  Component,
  Renderer,
  RendererScope,
  Rendering,
} from "../renderer/mod.ts";
import { Destructor } from "../scope.ts";
import { capitalize, sapRequireControl } from "./utils.ts";

export type Ui5ControlConstructor = (new (id?: string) => Ui5Control) & {
  extend(name: string, props: { renderer(): void }): Ui5ControlConstructor;
};

export interface AggregationInfo {
  name: string;
  singularName: string;
}

export type Ui5Control = {
  getMetadata(): {
    getAggregation(name: string): AggregationInfo;
    getDefaultAggregation(): AggregationInfo;
  };
  destroy(): void;
  placeAt(element: Element): Ui5Control;
  [_: string]: any;
};

export enum Ui5NodeType {
  Control,
  Aggregation,
}

export type Ui5Node =
  | {
      type: Ui5NodeType.Control;
      control: Promise<Ui5Control>;
      aggregation?: Ui5Node & { type: Ui5NodeType.Aggregation };
    }
  | {
      type: Ui5NodeType.Aggregation;
      control?: Promise<Ui5Control>;
      name?: string;
      tempChildren?: (Ui5Node & { type: Ui5NodeType.Control })[];
    };

export const Marker = sapRequireControl("sap/ui/core/Control").then((Control) =>
  Control.extend("shingo.Marker", {
    renderer: () => {},
  })
);

export class Ui5Renderer extends Renderer<
  Ui5Control | Promise<Ui5Control>,
  Ui5Node
> {
  _currentControl: Ui5Control | undefined;
  _currentAggregationInfo: AggregationInfo | undefined;

  private _getAggregationInfo(
    control: Ui5Control,
    name: string | undefined
  ): AggregationInfo {
    return name != null
      ? control.getMetadata().getAggregation(name)
      : control.getMetadata().getDefaultAggregation();
  }

  createNode(control: Ui5Control | Promise<Ui5Control>): Ui5Node {
    return {
      type: Ui5NodeType.Control,
      control: Promise.resolve(control),
    };
  }

  createMarker(): Ui5Node {
    return {
      type: Ui5NodeType.Control,
      control: Marker.then((Marker) => new Marker()),
    };
  }

  appendNode(parent: Ui5Node, node: Ui5Node): void {
    if (
      parent.type === Ui5NodeType.Control &&
      node.type === Ui5NodeType.Control
    ) {
      this.appendNode(
        {
          type: Ui5NodeType.Aggregation,
          control: parent.control,
        },
        node
      );
    } else if (
      parent.type === Ui5NodeType.Control &&
      node.type === Ui5NodeType.Aggregation
    ) {
      if (node.control != null) {
        throw new Error("Aggregation is already linked to another control");
      }

      node.control = parent.control;

      const tempChildren = node.tempChildren;
      parent.control.then(async (control) => {
        const children = await Promise.all(
          (tempChildren ?? []).map((child) => child.control)
        );

        for (const child of children) {
          control[
            `add${capitalize(
              this._getAggregationInfo(control, node.name).singularName
            )}`
          ](child);
        }
      });

      node.tempChildren = undefined;
    } else if (
      parent.type === Ui5NodeType.Aggregation &&
      node.type === Ui5NodeType.Control
    ) {
      node.aggregation = parent;

      if (parent.control == null) {
        (parent.tempChildren ??= []).push(node);
      } else {
        Promise.all([parent.control, node.control]).then(
          ([parentControl, nodeControl]) => {
            parentControl[
              `add${capitalize(
                this._getAggregationInfo(parentControl, parent.name)
                  .singularName
              )}`
            ](nodeControl);
          }
        );
      }
    } else {
      throw new Error("Cannot append aggregation to an aggregation");
    }
  }

  insertNode(node: Ui5Node, before: Ui5Node): void {
    if (
      node.type === Ui5NodeType.Control &&
      before.type === Ui5NodeType.Control
    ) {
      const { aggregation } = before;
      if (aggregation == null) {
        throw new Error("Cannot insert control outside an aggregation");
      }

      node.aggregation = aggregation;

      if (aggregation.control == null) {
        aggregation.tempChildren ??= [];
        const index = aggregation.tempChildren.indexOf(before);
        aggregation.tempChildren.splice(index, 0, node);
      } else {
        Promise.all([aggregation.control, node.control, before.control]).then(
          ([control, nodeControl, beforeControl]) => {
            const index =
              control[
                `get${capitalize(
                  this._getAggregationInfo(control, aggregation.name).name
                )}`
              ]().indexOf(beforeControl);
            control[
              `insert${capitalize(
                this._getAggregationInfo(control, aggregation.name).singularName
              )}`
            ](nodeControl, index);
          }
        );
      }
    } else {
      throw new Error("Inserting aggregations is not supported");
    }
  }

  removeNode(node: Ui5Node): void {
    node.control?.then((control) => {
      if (node.type === Ui5NodeType.Control) {
        control.destroy();
      } else if (
        node.type === Ui5NodeType.Aggregation &&
        node.control != null
      ) {
        control[
          `destroy${capitalize(
            this._getAggregationInfo(control, node.name).name
          )}`
        ]();
      }
    });
  }

  mountToDom(
    component: Component<any, Ui5Renderer>,
    element: Element
  ): Destructor {
    const s = new RendererScope(this);
    const [rendering, destructor] = component.reifyWithDestructor(s);
    const promControls: Promise<Ui5Control>[] = [];

    function getControls(rendering: Rendering<Ui5Renderer>) {
      for (const child of rendering) {
        if (Array.isArray(child)) {
          getControls(child);
        } else if (child.type === Ui5NodeType.Control) {
          promControls.push(child.control);
        }
      }
    }

    getControls(rendering);

    const controls = Promise.all(promControls);

    controls.then((controls) => {
      for (const control of controls) {
        control.placeAt(element);
      }
    });

    return destructor;
  }
}
