import { useArrayMutation } from "../array_mutation.js";
import {
  MaybeSignal,
  Signal,
  SignalLike,
  useEffect,
  useSignal,
  useSubscope,
} from "../scope.js";
import { useRenderer } from "../renderer.js";
import { createTemplate, Template } from "../template.js";

interface KeyMeta {
  _subnodes?: SignalLike<Node[]>;
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
    const [nodes, setNodes] = useSignal<Node[]>([anchor], { force: true });
    const keyMap = new Map<unknown, KeyMeta>();
    const mutationResult = useArrayMutation(items, keyFn);

    const lookForAnchor = (index: number): Node => {
      for (let i = index - 1; i >= 0; i--) {
        const key = keyFn(items()[index - 1], index - 1);
        const nodes = keyMap.get(key)?._subnodes;

        if (nodes && nodes().length > 0) {
          return nodes()[nodes().length - 1];
        }
      }

      return anchor;
    };

    useEffect(() => {
      for (const mutation of mutationResult()._mutations) {
        if (mutation._type == "r") {
          const { _subnodes, _destroy } = keyMap.get(mutation._key) ?? {};
          _destroy?.();

          setNodes((nodes) => {
            const index = nodes.indexOf(_subnodes?.()[0]!);
            if (index > 0) {
              nodes.splice(index, _subnodes?.().length);
            }

            return nodes;
          });

          _subnodes?.().forEach((node) => node.parentNode?.removeChild(node));
          keyMap.delete(mutation._key);
        } else if (mutation._type == "a") {
          let _subnodes: SignalLike<Node[]> | undefined;

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

            _subnodes = props.children?.(item, index, items).build();

            const itemAnchor = lookForAnchor(mutation._index);

            setNodes((nodes) => {
              const anchorIndex = nodes.indexOf(itemAnchor);
              if (anchorIndex >= 0) {
                nodes.splice(anchorIndex + 1, 0, ...(_subnodes?.() ?? []));
              }

              return nodes;
            });

            _subnodes?.().forEach((node) =>
              itemAnchor.parentNode?.insertBefore(node, itemAnchor.nextSibling),
            );
          });

          keyMap.set(mutation._key, { _subnodes, _destroy: destroy });
        } else if (mutation._type == "m") {
          const { _subnodes } = keyMap.get(mutation._key) ?? {};
          const itemAnchor = lookForAnchor(mutation._to);

          setNodes((nodes) => {
            const index = nodes.indexOf(_subnodes?.()[0]!);
            if (index >= 0) {
              nodes.splice(index, _subnodes?.().length);
            }

            const anchorIndex = nodes.indexOf(itemAnchor);
            if (anchorIndex >= 0) {
              nodes.splice(anchorIndex + 1, 0, ...(_subnodes?.() ?? []));
            }

            return nodes;
          });

          _subnodes?.().forEach((node) =>
            itemAnchor.parentNode?.insertBefore(node, itemAnchor.nextSibling),
          );
        }
      }
    }, [mutationResult]);

    return nodes;
  });
