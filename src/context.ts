import { useRenderer } from "./renderer.js";
import { useMemo, Signal, SetSignalOptions, MaybeSignal } from "./scope.js";

const contextSym = Symbol("Context");

type ContextEvent<T> = CustomEvent<(value: T) => void>;

/**
 * A value that can be passed through the component tree without having to be
 * explicitly passed as a prop.
 */
export interface Context<in out T> {
  readonly [contextSym]: string;
  /** @ignore */
  readonly _init: T;
  /** @ignore */
  readonly _opts?: SetSignalOptions;
}

/**
 * Creates a new context with the given value.
 */
export const createContext: (<T>(
  value: T,
  opts?: SetSignalOptions,
) => Context<T>) &
  (<T>(value?: T, opts?: SetSignalOptions) => Context<T | undefined>) = (<T>(
  value?: T,
  opts?: SetSignalOptions,
): Context<T | undefined> => ({
  [contextSym]: Math.random().toString(36).slice(2),
  _init: value,
  _opts: opts,
})) as any;

export const isContext = (value: any): value is Context<unknown> =>
  !!value?.[contextSym];

export const provideContext = <T>(
  context: Context<T>,
  element: Element,
  value: MaybeSignal<T | undefined>,
) => {
  element.addEventListener(context[contextSym], (evt) => {
    const innerValue = MaybeSignal.get(value);

    if (innerValue !== undefined) {
      evt.stopPropagation();
      (evt as ContextEvent<T>).detail(innerValue);
    }
  });
};

export const useContext = <T>(context: Context<T>): Signal<T> => {
  const renderer = useRenderer();

  return useMemo(() => {
    let result = context._init;

    renderer._component?.dispatchEvent(
      new CustomEvent(context[contextSym], {
        detail: (value) => (result = value),
        bubbles: true,
        composed: true,
      }) as ContextEvent<T>,
    );

    return result;
  });
};
