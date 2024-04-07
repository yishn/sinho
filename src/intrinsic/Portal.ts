import { FunctionalComponent } from "../component.js";
import { runWithRenderer } from "../renderer.js";
import { useEffect } from "../scope.js";
import { createTemplate } from "../template.js";
import { Children, Fragment } from "./Fragment.js";

export const Portal: FunctionalComponent<{
  mount: Node;
  svg?: boolean;
  children?: Children;
}> = ({ mount, svg, children }) =>
  createTemplate(() =>
    runWithRenderer((renderer) => {
      renderer._isSvg = svg;

      const nodes = Fragment({ children }).build();

      useEffect(() => {
        for (const node of nodes) {
          mount.appendChild(node);
        }

        return () => {
          for (const node of nodes) {
            mount.removeChild(node);
          }
        };
      });

      return [];
    }),
  );
