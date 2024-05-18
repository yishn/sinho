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
    const [nodes, setNodes] = useSignal<(SignalLike<Node[]> | undefined)[]>(
      [],
      { force: true },
    );
    const keyMap = new Map<unknown, KeyMeta>();
    const mutationResult = useArrayMutation(items, keyFn);

    const lookForAnchor = (index: number): Node => {
      for (let i = index - 1; i >= 0; i--) {
        const subnodes = nodes()[i];

        if (subnodes && subnodes().length > 0) {
          return subnodes()[subnodes().length - 1];
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
            nodes.splice(mutation._index, 1);
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

            let itemAnchor = lookForAnchor(mutation._index);

            setNodes((nodes) => {
              nodes.splice(mutation._index, 0, _subnodes);
              return nodes;
            });

            _subnodes?.().forEach((node) => {
              itemAnchor.parentNode?.insertBefore(node, itemAnchor.nextSibling);
              itemAnchor = node;
            });
          });

          keyMap.set(mutation._key, { _subnodes, _destroy: destroy });
        } else if (mutation._type == "m") {
          const { _subnodes } = keyMap.get(mutation._key) ?? {};

          setNodes((nodes) => {
            nodes.splice(mutation._from, 1);
            nodes.splice(mutation._to, 0, _subnodes);
            return nodes;
          });

          let itemAnchor = lookForAnchor(mutation._to);

          _subnodes?.().forEach((node) => {
            itemAnchor.parentNode?.insertBefore(node, itemAnchor.nextSibling);
            itemAnchor = node;
          });
        }
      }
    }, [mutationResult]);

    return useMemo(() =>
      [anchor as Node].concat(nodes().flatMap((nodes) => nodes?.() ?? [])),
    );
  });
