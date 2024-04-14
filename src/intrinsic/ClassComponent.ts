import type { DomProps } from "../dom.js";
import { useRenderer } from "../renderer.js";
import { createTemplate } from "../template.js";
import { hydrateElement } from "./TagComponent.js";

export const ClassComponent = <T extends HTMLElement>(
  type: new () => T,
  props: DomProps<T> & Record<string, unknown>,
) =>
  createTemplate(() => {
    const node = useRenderer()._node(() => new type());
    customElements.upgrade(node);

    hydrateElement(node, false, props);

    return [node];
  });
