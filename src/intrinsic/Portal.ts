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
    runWithRenderer({ _svg: false }, () => {
      const nodes = Fragment({ children }).build();

      useEffect(() => {
        for (const node of nodes) {
          mount.appendChild(node);
        }

        return () => {
          for (const node of nodes) {
            node.parentNode?.removeChild(node);
          }
        };
      });

      return [];
    }),
  );
