import { MaybeSignal, useEffect } from "../scope.js";
import { FunctionalComponent } from "../component.js";
import { createTemplate, useRenderer } from "../renderer.js";

export const Text: FunctionalComponent<{
  children?: MaybeSignal<string | number | undefined | null>;
}> = ({ children }) =>
  createTemplate(() => {
    const renderer = useRenderer();
    const anchor = renderer._node(() => document.createComment(""));
    const node = renderer._node(() => document.createTextNode(""));

    useEffect(() => {
      const text = MaybeSignal.get(children)?.toString() ?? "";

      node.textContent = text;
    });

    return [anchor, node];
  });
