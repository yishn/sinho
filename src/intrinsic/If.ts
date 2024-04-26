import type { FunctionalComponent } from "../component.js";
import { createTemplate, type Template } from "../template.js";
import { MaybeSignal, useEffect, useMemo, useSubscope } from "../scope.js";
import { runWithRenderer, useRenderer } from "../renderer.js";
import { Children, Fragment } from "./Fragment.js";

/**
 * `If` is a component that can be used to render conditionally.
 */
export const If: FunctionalComponent<{
  condition?: MaybeSignal<boolean>;
  children?: Children;
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
  children?: Children;
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
      const anchor = renderer._node(() => document.createComment(""));
      const nodes: Node[] = [anchor];
      const template = useMemo(() =>
        condition() ? Fragment({ children: props.children }) : null,
      );

      let subnodes: Node[] = [];

      useEffect(() => {
        subnodes.forEach((node) => node.parentNode?.removeChild(node));
        nodes.length = 1;

        const [, destroy] = useSubscope(() => {
          subnodes = template()?.build() ?? [];
          anchor.after(...subnodes);
          nodes.push(...subnodes);
        });

        return destroy;
      }, [template]);

      return nodes;
    }),
  );
};

/**
 * `Else` indicates the `else` block for {@link If} and {@link ElseIf}.
 */
export const Else: FunctionalComponent<{ children?: Children }> = ({
  children,
}) => {
  return ElseIf({ condition: true, children });
};
