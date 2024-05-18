import { FunctionalComponent } from "../component.js";
import { runWithRenderer } from "../renderer.js";
import { useEffect } from "../scope.js";
import { createTemplate } from "../template.js";
import { Children, Fragment } from "./Fragment.js";

export const Portal: FunctionalComponent<{
  mount: Node;
  children?: Children;
}> = ({ mount, children }) =>
  createTemplate(() =>
    runWithRenderer({ _nodes: undefined }, () => {
      const nodes = Fragment({ children }).build();

      useEffect(() => {
        nodes().forEach((node) => mount.appendChild(node));

        return () => {
          nodes().forEach((node) => node.parentNode?.removeChild(node));
        };
      }, []);

      return () => [];
    }),
  );
