import { useScope, useSignal } from "../scope.js";
import { FunctionalComponent } from "../component.js";
import { createTemplate } from "../template.js";
import { Children, Fragment } from "./Fragment.js";
import { createContext, provideContext, useContext } from "../context.js";
import { If } from "./If.js";

const ErrorContext = createContext([
  (err: unknown): void => {
    throw err;
  },
  (): void => {},
] as const);

/**
 * `ErrorBoundary` is a component that can be used to catch errors in the
 * component tree.
 */
export const ErrorBoundary: FunctionalComponent<{
  fallback?: FunctionalComponent<{
    error: unknown;
    reset: () => void;
  }>;
  children?: Children;
}> = ({ fallback, children }) => {
  let error: unknown;
  const [showError, setShowError] = useSignal(false);

  const show = (err: unknown) => {
    error = err;
    setShowError(true);
  };
  const reset = () => setShowError(false);

  return If({
    condition: showError,
    then: createTemplate(() => fallback?.({ error, reset }) ?? []),
    else: createTemplate(() => {
      provideContext(ErrorContext, [show, reset]);
      const s = useScope();
      s._onError = show;

      return Fragment({ children });
    }),
  });
};

export const useErrorBoundary = (): readonly [
  show: (err: unknown) => void,
  reset: () => void,
] => useContext(ErrorContext)();
