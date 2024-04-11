import type { FunctionalComponent } from "../component.js";
import { createTemplate, type Template } from "../template.js";
import { MaybeSignal, useEffect, useMemo, useSubscope } from "../scope.js";
import { runWithRenderer, useRenderer } from "../renderer.js";

/**
 * `If` is a component that can be used to render conditionally.
 */
export const If: FunctionalComponent<{
  condition?: MaybeSignal<boolean>;
  children?: Template;
}> = (props) => {
  const renderer = useRenderer();
  renderer._ifConditions = [];

  return ElseIf({ condition: props.condition, children: props.children });
};

/**
 * `ElseIf` serves as an `else if` block for {@link If}. It can also be chained
 * multiple times.
 */
export const ElseIf: FunctionalComponent<{
  condition?: MaybeSignal<boolean>;
  children?: Template;
}> = (props) => {
  const renderer = useRenderer();
  const conditions = renderer._ifConditions;
  const condition = useMemo(
    () =>
      conditions.every((condition) => !condition()) &&
      MaybeSignal.get<boolean | undefined>(props.condition),
  );

  renderer._ifConditions = [...conditions, condition];

  return runWithRenderer({ _ifConditions: [] }, () =>
    createTemplate(() => {
      const renderer = useRenderer();
      const anchor = renderer._node(() => document.createComment(""));
      const nodes: Node[] = [anchor];
      const template = useMemo(() =>
        condition() ? MaybeSignal.get(props.children) : null,
      );

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
    }),
  );
};

/**
 * `Else` indicates the `else` block for {@link If} and {@link ElseIf}.
 */
export const Else: FunctionalComponent<{ children?: Template }> = ({
  children,
}) => {
  return ElseIf({ condition: true, children });
};
