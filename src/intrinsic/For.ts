import { useArrayMutation } from "../array_mutation.js";
import {
  MaybeSignal,
  Signal,
  SignalLike,
  useEffect,
  useMemo,
  useSignal,
  useSubscope,
} from "../scope.js";
import { useRenderer } from "../renderer.js";
import { createTemplate, Template, TemplateNodes } from "../template.js";

interface KeyMeta {
  _subnodes: TemplateNodes;
  _destroy: () => void;
}

/**
 * `For` is a component that can be used to render a list of items.
 */
export const For = <T>(props: {
  each?: MaybeSignal<readonly T[]>;
  key?: (item: T, index: number) => string | number;
  children?: (
    item: Signal<T>,
    index: Signal<number>,
    arr: SignalLike<readonly T[]>,
  ) => Template;
}): Template =>
  createTemplate(() => {
    const renderer = useRenderer();
    const items = MaybeSignal.upgrade(props.each ?? []);
    const anchor = renderer._node(() => document.createComment(""));
    const keyFn = props.key ?? ((_, i) => i);
    const nodes: [Comment, TemplateNodes[]] = [anchor, []];
    const keyMap = new Map<unknown, KeyMeta>();
    const mutationResult = useArrayMutation(items, keyFn);

    const lookForAnchor = (index: number): Node =>
      TemplateNodes.last(nodes[1], index - 1) ?? anchor;

    useEffect(() => {
      for (const mutation of mutationResult()._mutations) {
        if (mutation._type == "r") {
          const { _subnodes, _destroy } = keyMap.get(mutation._key) ?? {};
          _destroy?.();

          nodes[1].splice(mutation._index, 1);

          TemplateNodes.forEach(_subnodes ?? [], (node) =>
            node.parentNode?.removeChild(node),
          );
          keyMap.delete(mutation._key);
        } else if (mutation._type == "a") {
          let _subnodes!: TemplateNodes;

          const [, destroy] = useSubscope(() => {
            const [index, setIndex] = useSignal(mutation._index);
            const [item, setItem] = useSignal(items()[mutation._index]);

            useEffect(() => {
              if (0 <= index() && index() < items().length) {
                setItem(() => items()[index()]);
              }
            });

            useEffect(() => {
              const index = mutationResult()._map.get(mutation._key);

              if (index != null) {
                setIndex(index);
              }
            });

            _subnodes = props.children?.(item, index, items).build() ?? [];
            nodes[1].splice(mutation._index, 0, _subnodes);

            let itemAnchor = lookForAnchor(mutation._index);

            TemplateNodes.forEach(_subnodes, (node) => {
              itemAnchor.parentNode?.insertBefore(node, itemAnchor.nextSibling);
              itemAnchor = node;
            });
          });

          keyMap.set(mutation._key, { _subnodes, _destroy: destroy });
        } else if (mutation._type == "m") {
          const { _subnodes } = keyMap.get(mutation._key) ?? {};

          nodes[1].splice(mutation._from, 1);
          nodes[1].splice(mutation._to, 0, _subnodes ?? []);

          let itemAnchor = lookForAnchor(mutation._to);

          TemplateNodes.forEach(_subnodes ?? [], (node) => {
            itemAnchor.parentNode?.insertBefore(node, itemAnchor.nextSibling);
            itemAnchor = node;
          });
        }
      }
    }, [mutationResult]);

    return nodes;
  });
