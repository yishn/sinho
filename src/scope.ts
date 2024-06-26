/**
 * Represents a signal-based computation.
 */
export interface SignalLike<out T> {
  /**
   * Gets the current value of the signal with tracking by default.
   */
  (): T;
}

/**
 * Represents a value that tracks changes over time.
 */
export interface Signal<out T> extends SignalLike<T> {
  /** @ignore */
  _effects: Set<Effect>;

  /**
   * Accesses the current value of the signal without tracking.
   */
  peek(): T;
}

export interface SignalOptions<T> extends SetSignalOptions {
  /**
   * A custom equality function to compare the new value with the old value.
   */
  equals?: (a: T, b: T) => boolean;
}

export interface SetSignalOptions {
  /**
   * Whether to force the update of the signal even if the new value has the
   * same reference.
   */
  force?: boolean;
  /**
   * Whether to suppress the update of the signal's effects.
   */
  silent?: boolean;
}

/**
 * Can be used to update a signal with a new value.
 */
export interface SignalSetter<in T, out U = T> {
  (update: (value: U) => T, opts?: SetSignalOptions): void;
  (value: T extends Function ? never : T, opts?: SetSignalOptions): void;
}

export interface SubscopeOptions {
  details?: object;
}

interface Effect {
  _scope: Scope;
  _pure: boolean;
  _clean?: Cleanup;
  _deps: Set<Signal<unknown>>;

  _run(): void;
}

/**
 * Represents the cleanup function of an effect.
 */
export type Cleanup = (() => void) | void | undefined | null;

export interface Scope<out T = {}> {
  readonly _parent?: Scope;
  _effects: Effect[];
  _subscopes: Scope[];
  _details: T;

  _run<T>(fn: () => T): T;
  _cleanup(): void;
}

const createScope = (parent?: Scope): Scope => {
  return {
    _parent: parent,
    _effects: [],
    _subscopes: [],
    _details: { ...parent?._details },

    _run<T>(fn: () => T): T {
      const prevScope = currScope;
      currScope = this;

      try {
        return fn();
      } finally {
        currScope = prevScope;
      }
    },

    _cleanup(): void {
      for (let i = this._subscopes.length - 1; i >= 0; i--) {
        this._subscopes[i]._cleanup();
      }

      this._subscopes = [];

      for (let i = this._effects.length - 1; i >= 0; i--) {
        const effect = this._effects[i];
        effect._clean?.();
        effect._run = () => {};

        effect._deps.forEach((signal) => signal._effects.delete(effect));
        effect._deps.clear();
      }

      this._effects = [];
    },
  };
};

let rootScope: Scope = createScope();
let currScope: Scope = rootScope;
let currUntracked: boolean = false;
let currEffect: Effect | undefined;
let currBatch:
  | {
      _setters: (() => void)[];
      _effects: Set<Effect>;
      _pureEffects: Set<Effect>;
    }
  | undefined;

/** @ignore */
export const useScope = <T = {}>(): Scope<T> => currScope as Scope<T>;

/**
 * Creates a new signal with the given value.
 * @returns A tuple with the signal and its setter.
 */
export const useSignal: (<T>(
  value: T,
  opts?: SignalOptions<T>,
) => readonly [Signal<T>, SignalSetter<T>]) &
  (<T>(
    value?: T,
    opts?: SignalOptions<T | undefined>,
  ) => readonly [Signal<T | undefined>, SignalSetter<T | undefined>]) = <T>(
  value: T,
  opts?: SignalOptions<T>,
): readonly [Signal<T>, SignalSetter<T>] => {
  const signal: Signal<T> = () => {
    if (!currUntracked && currEffect) {
      currEffect._deps.add(signal);
      signal._effects.add(currEffect);
    }

    return signal.peek();
  };

  signal._effects = new Set();
  signal.peek = () => value;

  const setter = (arg: T | ((value: T) => T), innerOpts?: SetSignalOptions) => {
    const allOpts = { ...opts, ...innerOpts };
    allOpts.equals ??= (a, b) => a === b;

    if (currBatch) {
      const newValue =
        typeof arg == "function"
          ? (arg as (value: T) => T)(signal.peek())
          : arg;

      if (allOpts?.force || !allOpts.equals(newValue, signal.peek())) {
        if (allOpts?.force) {
          value = newValue;
        } else {
          currBatch._setters.push(() => (value = newValue));
        }

        if (!allOpts?.silent) {
          signal._effects.forEach((effect) => {
            if (effect._pure) {
              currBatch!._pureEffects.add(effect);
            } else {
              currBatch!._effects.add(effect);
            }
          });
        }
      }
    } else {
      useBatch(() => setter(arg, allOpts));
    }
  };

  return [signal, setter as any];
};

/**
 * Runs the given function in a batch.
 *
 * @param fn Any calls to signal setters inside the function will be batched
 * and updated at the same time.
 */
export const useBatch = <T>(fn: () => T): T => {
  if (currBatch) return fn();

  currBatch = {
    _setters: [],
    _effects: new Set(),
    _pureEffects: new Set(),
  };

  try {
    const result = fn();
    flushBatch();
    return result;
  } finally {
    currBatch = undefined;
  }
};

export const flushBatch = (): void => {
  while (
    currBatch &&
    currBatch._setters.length +
      currBatch._effects.size +
      currBatch._pureEffects.size >
      0
  ) {
    // Clean effect subscope

    currBatch._effects.forEach((effect) => effect._clean?.());

    // Run signal updates

    currBatch._setters.forEach((setter) => setter());
    currBatch._setters = [];

    // Run next effect

    const effect: Effect | undefined =
      currBatch._pureEffects.values().next().value ??
      currBatch._effects.values().next().value;

    if (effect) {
      effect._run();
      currBatch._pureEffects.delete(effect);
      currBatch._effects.delete(effect);
    }
  }
};

let pureEffectFlag: boolean = false;

/**
 * Creates an effect which will rerun when any accessed signal changes.
 *
 * @param fn The function to run; it can return a cleanup function.
 */
export const useEffect = (
  fn: () => Cleanup,
  deps?: SignalLike<unknown>[],
): void => {
  const untracked = !!deps;

  const effect: Effect = {
    _scope: currScope,
    _pure: pureEffectFlag,
    _deps: new Set(),

    _run(): void {
      const prevEffect = currEffect;
      const prevUntracked = currUntracked;

      currEffect = this;

      try {
        // Clean up dependencies and listeners

        this._deps.forEach((dep) => dep._effects.delete(this));
        this._deps.clear();

        if (deps) {
          // Track specified dependencies

          currUntracked = false;
          deps.forEach((dep) => dep());
        }

        // Run effect

        currUntracked = untracked;

        this._clean?.();

        const cleanup = this._scope._run(() => useBatch(fn));

        this._clean = !cleanup
          ? null
          : () => {
              this._scope._run(() => useBatch(cleanup));
              this._clean = null;
            };
      } finally {
        // Restore scope state

        currEffect = prevEffect;
        currUntracked = prevUntracked;
      }
    },
  };

  currScope._effects.push(effect);
  effect._run();

  if (!effect._deps.size && !effect._clean) {
    // Optimization: Destroy effect since there's no cleanup and this effect
    // won't be called again

    currScope._effects.pop();
  }
};

/**
 * Creates a memoized signal.
 *
 * @param fn The computation function.
 */
export const useMemo = <T>(fn: () => T, opts?: SignalOptions<T>): Signal<T> => {
  const [memo, setMemo] = useSignal<T>(
    undefined,
    opts as SignalOptions<T | undefined>,
  );

  let firstTime = true;
  pureEffectFlag = true;

  try {
    useEffect(() => {
      setMemo(fn, firstTime ? { force: true } : {});

      firstTime = false;
    });
  } finally {
    pureEffectFlag = false;
  }

  return memo as Signal<T>;
};

/**
 * Executes a function inside a subscope which can be manually destroyed.
 *
 * @param fn The function to run in the subscope.
 * @returns A function to manually destroy the subscope.
 */
export const useSubscope = <T>(
  fn: () => T,
  opts?: SubscopeOptions,
): [T, () => void] => {
  const prevBatch = currBatch;
  currBatch = undefined;

  const parent = currScope;
  const scope = createScope(parent);
  Object.assign(scope._details, opts?.details);

  try {
    parent._subscopes.push(scope);
    const result = scope._run(fn);

    return [
      result,
      () => {
        const index = parent._subscopes.indexOf(scope);
        if (index >= 0) {
          parent._subscopes.splice(index, 1);
        }

        scope._cleanup();
      },
    ];
  } finally {
    currBatch = prevBatch;
  }
};

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
export const useRef: (<T>(value: T, opts?: SignalOptions<T>) => RefSignal<T>) &
  (<T>(
    value?: T,
    opts?: SignalOptions<T | undefined>,
  ) => RefSignal<T | undefined>) = (<T>(
  value?: T,
  opts?: SignalOptions<T | undefined>,
): RefSignal<T> & RefSignal<T | undefined> => {
  const [signal, setter] = useSignal(value, opts);
  (signal as RefSignal<T | undefined>).set = setter;
  return signal as RefSignal<T> & RefSignal<T | undefined>;
}) as any;

/**
 * Represents a value that can be a signal or a constant value.
 *
 * Note that functions are not allowed as constant values.
 */
export type MaybeSignal<T> = SignalLike<T> | (T extends Function ? never : T);

/**
 * @namespace
 */
export const MaybeSignal = {
  /**
   * Transforms the given {@link MaybeSignal} into a {@link Signal}.
   */
  upgrade:
    <T>(signal: MaybeSignal<T>): SignalLike<T> =>
    () =>
      MaybeSignal.get(signal),

  /**
   * Gets the value of the given {@link MaybeSignal}.
   */
  get: <T>(signal: MaybeSignal<T>): T =>
    typeof signal == "function" ? (signal as SignalLike<T>)() : signal,

  /**
   * Accesses the value of the given {@link MaybeSignal} without tracking.
   */
  peek<T>(signal: MaybeSignal<T>): T {
    const prevUntracked = currUntracked;
    currUntracked = true;

    try {
      return this.get(signal);
    } finally {
      currUntracked = prevUntracked;
    }
  },
};
