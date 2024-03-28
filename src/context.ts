import { SignalLike, useScope } from "./scope.js";
import { Ref, useRef } from "./ref.js";

const contextSym = Symbol("Context");

/**
 * A value that can be passed through the component tree without having to be
 * explicitly passed as a prop.
 */
export interface Context<in out T> {
  readonly [contextSym]: symbol;
  /** @ignore */
  readonly _init: T;
}

type Scope = ReturnType<typeof useScope>;
type ScopeExt<S extends symbol, T> = Scope & {
  [_ in S]?: {
    _override: Ref<T | undefined>;
    _signal: SignalLike<T>;
  };
};

/**
 * Creates a new context with the given value.
 */
export const createContext: (<T>(value: T) => Context<T>) &
  (<T>(value?: T) => Context<T | null>) = (<T>(
  value: T | null = null,
): Context<T | null> => ({
  [contextSym]: Symbol(),
  _init: value,
})) as any;

export const isContext = (value: any): value is Context<unknown> =>
  !!value?.[contextSym];

export const provideContext = <T>(context: Context<T>, value: T): void => {
  const sym: unique symbol = context[contextSym] as never;
  const scopeExt = useScope() as ScopeExt<typeof sym, T>;

  getContextInfo(scopeExt, context);
  scopeExt[sym]!._override.set(() => value);
};

export const getContextInfo = <T>(
  scope: Scope,
  context: Context<T>,
): NonNullable<ScopeExt<symbol, T>[symbol]> => {
  const sym: unique symbol = context[contextSym] as never;
  const scopeExt = scope as ScopeExt<typeof sym, T>;

  return (scopeExt[sym] ??= {
    _override: useRef<T | undefined>(),
    _signal: () =>
      scopeExt[sym]!._override() !== undefined
        ? scopeExt[sym]!._override()!
        : scope._parent
          ? getContextInfo(scope._parent, context)._signal()
          : context._init,
  });
};

export const useContext = <T>(context: Context<T>): T =>
  getContextInfo(useScope(), context)._signal();
