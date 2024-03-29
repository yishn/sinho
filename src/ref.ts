import { SetSignalOptions, Signal, SignalSetter, useSignal } from "./scope.js";

/**
 * Provide write capabilities to a signal.
 */
export interface RefSignal<in out T> extends Signal<T>, RefSignalSetter<T> {
  /**
   * Sets the value of the signal.
   */
  set: SignalSetter<T>;
}

/**
 * A contravariant variant of {@link RefSignal}.
 */
export interface RefSignalSetter<in T> {
  /**
   * Sets the value of the signal.
   */
  set: SignalSetter<T, unknown>;
}

/**
 * Creates a new signal with write capabilities.
 */
export const useRef: (<T>(value: T, opts?: SetSignalOptions) => RefSignal<T>) &
  (<T>(value?: T, opts?: SetSignalOptions) => RefSignal<T | undefined>) = <T>(
  value?: T,
  opts?: SetSignalOptions,
): RefSignal<T> & RefSignal<T | undefined> => {
  const [signal, setter] = useSignal(value, opts);
  (signal as RefSignal<T | undefined>).set = setter;
  return signal as RefSignal<T> & RefSignal<T | undefined>;
};
