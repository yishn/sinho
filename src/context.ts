import type { FunctionalComponent } from "./component.js";
import { Children, Fragment } from "./intrinsic/Fragment.js";
import { useEffect, useScope, useSubscope } from "./scope.js";
import { createTemplate } from "./renderer.js";

/**
 * A value that can be passed through the component tree without having to be
 * explicitly passed as a prop.
 */
export interface Context<in out T> {
  /**
   * A component that provides a value to a context to its children.
   */
  Provider: FunctionalComponent<{
    value: T;
    children?: Children;
  }>;
}

interface ContextExt<in out T> extends Context<T> {
  readonly _sym: symbol;
  readonly _init: T;
}

/**
 * Creates a new context with the given value.
 */
export const createContext: (<T>(value: T) => Context<T>) &
  (<T>(value?: T) => Context<T | undefined>) = <T>(value: T): Context<T> => {
  const sym = Symbol();

  const context: ContextExt<T> = {
    _sym: sym,
    _init: value,

    Provider: (props) =>
      createTemplate(() => {
        let result!: Node[];

        const destroy = useSubscope(() => {
          const s = useScope() as { [sym]?: T };
          s[sym] = props.value;

          result = Fragment({ children: props.children }).build();
        });

        useEffect(() => destroy);

        return result;
      }),
  };

  return context;
};

/**
 * Returns the current value of the given context.
 */
export const useContext = <T>(context: Context<T>): T => {
  const sym: unique symbol = (context as ContextExt<T>)._sym as never;

  let s = useScope() as
    | (ReturnType<typeof useScope> & { [sym]?: T })
    | undefined;

  while (s) {
    if (sym in s) return s[sym]!;
    s = s._parent;
  }

  return (context as ContextExt<T>)._init;
};
