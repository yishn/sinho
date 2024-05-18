import { MaybeSignal, useEffect, useMemo } from "../scope.js";
import { FunctionalComponent } from "../component.js";
import { useRenderer } from "../renderer.js";
import { createTemplate } from "../template.js";

export const Text: FunctionalComponent<{
  text?: MaybeSignal<string | number | undefined | null>;
  marker?: boolean;
}> = ({ text, marker }) =>
  createTemplate(() => {
    const renderer = useRenderer();
    const anchor = marker && renderer._node(() => document.createComment(""));
    const node = renderer._node(() => document.createTextNode(""));

    useEffect(() => {
      const textContent = "" + (MaybeSignal.get(text) ?? "");

      if (node.textContent != textContent) {
        node.textContent = textContent;
      }
    });

    return anchor ? [anchor, node] : [node];
  });
