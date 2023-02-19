import { Renderer } from "../renderer/mod.ts";
import { capitalize, Marker } from "./utils.ts";

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
      control: Ui5Control;
      aggregation?: Ui5Node & { type: Ui5NodeType.Aggregation };
    }
  | {
      type: Ui5NodeType.Aggregation;
      control?: Ui5Control;
      name: string;
      tempChildren?: (Ui5Node & { type: Ui5NodeType.Control })[];
    };

export class Ui5Renderer extends Renderer<Ui5Node, Ui5Node> {
  static async init(): Promise<Ui5Renderer> {
    return new Ui5Renderer(await Marker);
  }

  private constructor(private Marker: new () => Ui5Control) {
    super();
  }

  createNode(arg: Ui5Node): Ui5Node {
    return arg;
  }

  createMarker(): Ui5Node {
    return {
      type: Ui5NodeType.Control,
      control: new this.Marker(),
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
          name: parent.control.getMetadata().getDefaultAggregation().name,
        },
        node
      );
    } else if (
      parent.type === Ui5NodeType.Control &&
      node.type === Ui5NodeType.Aggregation
    ) {
      if (node.control != null && node.control !== parent.control) {
        throw new Error("Aggregation is already linked to another control");
      }

      node.control = parent.control;

      for (const child of node.tempChildren ?? []) {
        parent.control[`add${capitalize(node.name)}`](child.control);
      }

      node.tempChildren = undefined;
    } else if (
      parent.type === Ui5NodeType.Aggregation &&
      node.type === Ui5NodeType.Control
    ) {
      node.aggregation = parent;

      if (parent.control == null) {
        (parent.tempChildren ??= []).push(node);
      } else {
        parent.control[`add${capitalize(parent.name)}`](node.control);
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
        const index = aggregation.control[
          `get${capitalize(aggregation.name)}`
        ]().indexOf(before.control);
        aggregation.control[`insert${capitalize(aggregation.name)}`](
          node.control,
          index
        );
      }
    } else {
      throw new Error("Inserting aggregations is not supported");
    }
  }

  removeNode(node: Ui5Node): void {
    if (node.type === Ui5NodeType.Control) {
      node.control.destroy();
    } else if (node.type === Ui5NodeType.Aggregation && node.control != null) {
      node.control[`destroy${capitalize(node.name)}`]();
    }
  }
}
