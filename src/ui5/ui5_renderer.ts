import {
  Component,
  Renderer,
  RendererScope,
  Rendering,
} from "../renderer/mod.ts";
import { Destructor } from "../scope.ts";
import { capitalize } from "./utils.ts";

export type Ui5ControlConstructor = (new (id?: string) => Ui5Control) & {
  extend(name: string, props: { renderer(): void }): Ui5ControlConstructor;
};

export interface AggregationInfo {
  name: string;
  singularName: string;
  multiple: boolean;
}

export type Ui5Control = {
  getMetadata(): {
    getAggregation(name: string): AggregationInfo;
    getDefaultAggregation(): AggregationInfo;
  };
  destroy(): void;
  placeAt(element: Element): Ui5Control;
  addStyleClass(className: string): Ui5Control;
  removeStyleClass(className: string): Ui5Control;
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
      name?: string;
      tempChildren?: (Ui5Node & { type: Ui5NodeType.Control })[];
    };

export class Ui5Renderer extends Renderer<Ui5Control, Ui5Node> {
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

  createNode(control: Ui5Control): Ui5Node {
    return {
      type: Ui5NodeType.Control,
      control: control,
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

      const aggregationInfo = this._getAggregationInfo(
        parent.control,
        node.name
      );

      node.control = parent.control;

      if (aggregationInfo.multiple) {
        for (const child of node.tempChildren ?? []) {
          parent.control[`add${capitalize(aggregationInfo.singularName)}`](
            child.control
          );
        }
      } else {
        parent.control[`set${capitalize(aggregationInfo.name)}`](
          (node.tempChildren ?? [])[0]?.control
        );
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
        const aggregationInfo = this._getAggregationInfo(
          parent.control,
          parent.name
        );

        if (aggregationInfo.multiple) {
          parent.control[`add${capitalize(aggregationInfo.singularName)}`](
            node.control
          );
        } else {
          parent.control[`set${capitalize(aggregationInfo.name)}`](
            node.control
          );
        }
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
        const aggregationInfo = this._getAggregationInfo(
          aggregation.control,
          aggregation.name
        );

        if (aggregationInfo.multiple) {
          aggregation.control[
            `remove${capitalize(aggregationInfo.singularName)}`
          ](node.control);

          const index = aggregation.control[
            `get${capitalize(
              this._getAggregationInfo(aggregation.control, aggregation.name)
                .name
            )}`
          ]().indexOf(before.control);

          aggregation.control[
            `insert${capitalize(aggregationInfo.singularName)}`
          ](node.control, index);
        } else {
          aggregation.control[`set${capitalize(aggregationInfo.name)}`](
            node.control
          );
        }
      }
    } else {
      throw new Error("Inserting aggregations is not supported");
    }
  }

  removeNode(node: Ui5Node): void {
    if (node.type === Ui5NodeType.Control) {
      node.control.destroy();
    } else if (node.type === Ui5NodeType.Aggregation && node.control != null) {
      node.control[
        `destroy${capitalize(
          this._getAggregationInfo(node.control, node.name).name
        )}`
      ]();
    }
  }

  mountToDom(
    component: Component<any, Ui5Renderer>,
    element: Element
  ): Destructor {
    const s = new RendererScope(this);
    const [rendering, destructor] = component.reifyWithDestructor(s);

    function append(rendering: Rendering<Ui5Renderer>) {
      for (const child of rendering) {
        if (Array.isArray(child)) {
          append(child);
        } else if (child.type === Ui5NodeType.Control) {
          child.control.placeAt(element);
        }
      }
    }

    append(rendering);

    return destructor;
  }
}
