import { FunctionalComponent } from "../component.js";
import { runWithRenderer } from "../renderer.js";
import { useEffect } from "../scope.js";
import { TemplateNodes, createTemplate } from "../template.js";
import { Children, Fragment } from "./Fragment.js";

export const Portal: FunctionalComponent<{
  mount: Node;
  children?: Children;
}> = ({ mount, children }) =>
  createTemplate(() =>
    runWithRenderer({ _nodes: undefined }, () => {
      const nodes = Fragment({ children }).build();

      useEffect(() => {
        TemplateNodes.forEach(nodes, (node) => mount.appendChild(node));

        return () => {
          TemplateNodes.forEach(nodes, (node) =>
            node.parentNode?.removeChild(node),
          );
        };
      }, []);

      return [];
    }),
  );
