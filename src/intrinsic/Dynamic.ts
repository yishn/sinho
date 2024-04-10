import { FunctionalComponent } from "../component.js";
import { MaybeSignal, useEffect, useMemo, useSubscope } from "../scope.js";
import { useRenderer } from "../renderer.js";
import { createTemplate, Template } from "../template.js";

/**
 * `Dynamic` is a component that can be used to render conditionally.
 *
 * On every change, it will replace all previously rendered nodes with new ones.
 *
 * @example
 * ```tsx
 * const App = () => (
 *   const [count, setCount] = useSignal(100);
 *
 *   <Dynamic
 *     render={() =>
 *       count() === 1 ? (
 *        <>
 *          <h3>Details</h3>
 *          { … }
 *        </>
 *       ) : count() > 1 ? (
 *        <p>Multiple items selected</p>
 *       ) : (
 *        <p>No items</p>
 *       )
 *     }
 *   />
 * );
 * ```
 */
export const Dynamic: FunctionalComponent<{
  render?: MaybeSignal<Template | undefined | void | null>;
}> = (props) =>
  createTemplate(() => {
    const renderer = useRenderer();
    const anchor = renderer._node(() => document.createComment(""));
    const nodes: Node[] = [anchor];
    const template = useMemo(() => MaybeSignal.get(props.render));

    useEffect(() => {
      const [subnodes, destroy] = useSubscope(() => {
        const subnodes = template()?.build() ?? [];
        anchor.after(...subnodes);
        nodes.push(...subnodes);
        return subnodes;
      });

      return () => {
        destroy();

        for (const node of subnodes ?? []) {
          node.parentNode?.removeChild(node);
        }

        nodes.length = 1;
      };
    }, [template]);

    return nodes;
  });
