import { FunctionalComponent } from "../component.js";
import { MaybeSignal, useEffect, useMemo, useSubscope } from "../scope.js";
import { createTemplate, Template, useRenderer } from "../renderer.js";

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
 *   ‹Dynamic
 *     render={() =>
 *       count() === 1 ? (
 *        ‹›
 *          ‹h3›Details‹/h3›
 *          { … }
 *        ‹/›
 *       ) : count() > 1 ? (
 *        ‹p›Multiple items selected‹/p›
 *       ) : (
 *        ‹p›No items‹/p›
 *       )
 *     }
 *   /›
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
      let subnodes: Node[];

      const destroy = useSubscope(() => {
        subnodes = template()?.build() ?? [];
        anchor.after(...subnodes);
        nodes.push(...subnodes);
      });

      return () => {
        destroy();

        for (let node of subnodes) {
          node.parentNode?.removeChild(node);
        }

        nodes.length = 1;
      };
    }, [template]);

    return nodes;
  });
