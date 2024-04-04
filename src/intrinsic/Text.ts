import { MaybeSignal, useEffect } from "../scope.js";
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
      node.textContent = "" + (MaybeSignal.get(text) ?? "");
    });

    return anchor ? [anchor, node] : [node];
  });
