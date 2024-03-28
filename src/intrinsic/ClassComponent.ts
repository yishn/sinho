import {
  _jsxPropsSym,
  ComponentConstructor,
  JsxProps,
  Metadata,
} from "../component.js";
import { createTemplate, useRenderer } from "../renderer.js";

export const ClassComponent = <M extends Metadata>(
  type: ComponentConstructor<M>,
  props: JsxProps<M>,
) =>
  createTemplate(() => {
    const node = useRenderer()._node(() => new type());
    customElements.upgrade(node);

    node[_jsxPropsSym] = props;
    return [node];
  });
