import { Renderer } from "../renderer/mod.ts";
import { capitalize, sapRequireControl } from "./utils.ts";

export type Ui5ControlConstructor = (new (id?: string) => Ui5Control) & {
  extend(name: string, props: { renderer(): void }): Ui5ControlConstructor;
};

export type Ui5Control = {
  getMetadata(): {
    getDefaultAggregation(): {
      name: string;
    };
  };
  destroy(): void;
  placeAt(id: string): Ui5Control;
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

      parent.control.then(async (control) => {
        const children = await Promise.all(
          (node.tempChildren ?? []).map((child) => child.control)
        );

        for (const child of children) {
          control[
            `add${capitalize(
              node.name ?? control.getMetadata().getDefaultAggregation().name
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
                parent.name ??
                  parentControl.getMetadata().getDefaultAggregation().name
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
            const name =
              aggregation.name ??
              control.getMetadata().getDefaultAggregation().name;
            const index =
              control[`get${capitalize(name)}`]().indexOf(beforeControl);
            control[`insert${capitalize(name)}`](nodeControl, index);
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
            node.name ?? control.getMetadata().getDefaultAggregation().name
          )}`
        ]();
      }
    });
  }
}
