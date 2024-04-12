import {
  ComponentConstructor,
  JsxProps,
  Metadata,
  componentSym,
} from "../component.js";
import { useRenderer } from "../renderer.js";
import { MaybeSignal, useEffect, useScope } from "../scope.js";
import { createTemplate } from "../template.js";
import { hydrateElement } from "./TagComponent.js";

export const ClassComponent = <M extends Metadata>(
  type: ComponentConstructor<M>,
  props: JsxProps<M>,
) =>
  createTemplate(() => {
    const node = useRenderer()._node(() => new type());
    customElements.upgrade(node);

    node[componentSym]._parentScope = useScope();

    const propsCopy = { ...props };

    // Make JSX props reactive

    for (const name in propsCopy) {
      if (
        name in node &&
        !["children", "style"].includes(name) &&
        !name.startsWith("on")
      ) {
        const maybeSignal = propsCopy[name];

        useEffect(() => {
          (node as any)[name] = MaybeSignal.get<any>(maybeSignal);
        });

        delete propsCopy[name];
      }
    }

    // Set other props

    hydrateElement(node, false, propsCopy);

    return [node];
  });
