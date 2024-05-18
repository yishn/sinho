import type { FunctionalComponent } from "../component.js";
import { TemplateNodes, createTemplate } from "../template.js";
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
  const prevConditions = renderer._ifConditions;
  const myCondition = MaybeSignal.upgrade<boolean | undefined>(props.condition);
  const fullCondition = useMemo(
    () => prevConditions.every((condition) => !condition()) && myCondition(),
  );

  renderer._ifConditions = [...prevConditions, myCondition];

  return createTemplate(() =>
    runWithRenderer({ _ifConditions: [] }, () => {
      const anchor = renderer._node(() => document.createComment(""));
      const nodes: [Comment, TemplateNodes] = [anchor, []];
      const template = useMemo(() =>
        fullCondition() ? Fragment({ children: props.children }) : null,
      );

      let subnodes: TemplateNodes = [];

      useEffect(() => {
        TemplateNodes.forEach(subnodes, (node) =>
          node.parentNode?.removeChild(node),
        );
        nodes[1] = [];

        const [, destroy] = useSubscope(() => {
          subnodes = template()?.build() ?? [];
          nodes[1] = subnodes;

          let before: Node = anchor;
          TemplateNodes.forEach(subnodes, (node) => {
            before.parentNode?.insertBefore(node, before.nextSibling);
            before = node;
          });
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
