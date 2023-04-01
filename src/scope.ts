const signalSym = Symbol("signal");
const effectSym = Symbol("effect");
const subscopeSym = Symbol("subscope");

export interface SignalLike<out T> {
  (): T;
}

export interface Signal<out T> extends SignalLike<T> {
  [signalSym]: {
    value: T;
    listeners: Effect[];
    deleted: boolean;
  };

  peek(): T;
  track(): T;
}

export type OptionalSignal<T> = T | SignalLike<T>;

export interface SignalSetOptions {
  force?: boolean;
  silent?: boolean;
}

export interface SignalSetter<in out T> {
  (value: T, opts?: SignalSetOptions): void;
  (update: (value: T) => T, opts?: SignalSetOptions): void;
}

interface Effect {
  [effectSym]: {
    clean: Destructor;
    dependencies: Signal<any>[];
    deleted: boolean;
  };

  (): void;
}

export interface EffectOptions {
  untracked?: boolean;
}

interface Cleanup {
  (): void;
}

class Subscope {
  parent?: Subscope;
  context?: Map<ScopeContext<unknown>, unknown>;
  signals: Signal<any>[] = [];
  effects: Effect[] = [];
  cleanups: Cleanup[] = [];
  subscopes: Subscope[] = [];

  getContext<T>(context: ScopeContext<T>): T {
    return (
      (this.context?.get(context) as T) ??
      this.parent?.getContext(context) ??
      context.defaultValue
    );
  }
}

export interface SubscopeOptions {
  leaked?: boolean;
}

interface DestructorInner {
  [subscopeSym]?: {
    subscope: Subscope;
  };
}

export interface Destructor extends DestructorInner {
  (): void;
}

export class ScopeContext<T> {
  constructor(public defaultValue: T) {}

  provide(s: Scope, value: T, f: () => void): void {
    s._subscopeInner((subscope) => {
      subscope.context = new Map([[this, value]]);
      f();
    });
  }
}

export class Scope {
  static context<T>(): ScopeContext<T | undefined>;
  static context<T>(defaultValue: T): ScopeContext<T>;
  static context<T>(defaultValue?: T): ScopeContext<T | undefined> {
    return new ScopeContext(defaultValue);
  }

  protected currentSubscope: Subscope = new Subscope();
  protected currentUntracked: boolean = false;
  protected currentEffect?: Effect;
  protected currentBatch?: {
    signals: [signal: Signal<any>, value: any][];
    effects: Effect[];
  };

  signal<T>(): [Signal<T | undefined>, SignalSetter<T | undefined>];
  signal<T>(value: T): [Signal<T>, SignalSetter<T>];
  signal<U>(value?: U): [Signal<U | undefined>, SignalSetter<U | undefined>] {
    type T = U | undefined;

    const signal: Signal<T> = Object.assign(
      (): T => {
        return !this.currentUntracked ? signal.track() : signal.peek();
      },
      {
        peek: () => signal[signalSym].value,
        track: () => {
          if (this.currentEffect != null) {
            if (!signal[signalSym].listeners.includes(this.currentEffect)) {
              signal[signalSym].listeners.push(this.currentEffect);
            }

            if (!this.currentEffect[effectSym].dependencies.includes(signal)) {
              this.currentEffect[effectSym].dependencies.push(signal);
            }
          }

          return signal.peek();
        },
        [signalSym]: {
          value,
          listeners: [],
          deleted: false,
        },
      }
    );

    this.currentSubscope.signals.push(signal);

    const setter = (arg: T | ((value: T) => T), opts?: SignalSetOptions) => {
      if (signal[signalSym].deleted) return;

      if (this.currentBatch != null) {
        const newValue =
          typeof arg === "function"
            ? (arg as (value: T) => T)(signal.peek())
            : arg;

        if (!!opts?.force || newValue !== signal.peek()) {
          this.currentBatch.signals.push([signal, newValue]);

          if (!opts?.silent) {
            for (const effect of signal[signalSym].listeners) {
              if (!this.currentBatch.effects.includes(effect)) {
                this.currentBatch.effects.push(effect);
              }
            }
          }
        }
      } else {
        this.batch(() => setter(arg, opts));
      }
    };

    return [signal, setter];
  }

  pin<P extends any[], T>(f: (...args: P) => T): (...args: P) => T {
    const [currentSubscope, currentEffect, currentUntracked] = [
      this.currentSubscope,
      this.currentEffect,
      this.currentUntracked,
    ];

    return (...args) => {
      const [prevSubscope, prevEffect, prevUntracked] = [
        this.currentSubscope,
        this.currentEffect,
        this.currentUntracked,
      ];

      [this.currentSubscope, this.currentEffect, this.currentUntracked] = [
        currentSubscope,
        currentEffect,
        currentUntracked,
      ];

      const result = f(...args);

      [this.currentSubscope, this.currentEffect, this.currentUntracked] = [
        prevSubscope,
        prevEffect,
        prevUntracked,
      ];

      return result;
    };
  }

  effect(f: () => void, opts?: EffectOptions): void {
    const effect: Effect = Object.assign(
      this.pin(() => {
        let effectData = effect[effectSym];
        if (effectData.deleted) return;

        // Clean up dependencies and listeners

        for (const signal of effectData.dependencies) {
          const index = signal[signalSym].listeners.indexOf(effect);
          if (index >= 0) {
            signal[signalSym].listeners.splice(index, 1);
          }
        }

        effectData.dependencies = [];

        // Run effect and make sure states are taken care of

        this.currentUntracked = !!opts?.untracked;
        this.currentEffect = effect;

        effectData.clean = this.subscope(() => {
          this.batch(() => {
            f();
          });
        });
      }),
      {
        [effectSym]: {
          clean: () => {},
          dependencies: [],
          deleted: false,
        },
      }
    );

    this.currentSubscope.effects.push(effect);
    effect();

    const effectData = effect[effectSym];

    if (
      effectData.dependencies.length === 0 &&
      (effectData.clean[subscopeSym]?.subscope.cleanups.length ?? 0) === 0
    ) {
      // Optimization: Remove effect since there's no cleanup and this effect
      // won't be called again

      this._cleanEffect(effect);
    }
  }

  cleanup(f: () => void): void {
    this.currentSubscope.cleanups.push(() => {
      const clean = this.subscope(() => f());
      clean();
    });
  }

  _subscopeInner(
    f: (subscope: Subscope) => void,
    opts?: SubscopeOptions
  ): Destructor {
    const subscope = new Subscope();
    const prevSubscope = this.currentSubscope;
    this.currentSubscope = subscope;
    subscope.context = prevSubscope.context;

    if (!opts?.leaked) {
      prevSubscope.subscopes.push(subscope);
      subscope.parent = prevSubscope;
    }

    f(subscope);

    this.currentSubscope = prevSubscope;

    return Object.assign(
      () => {
        this._cleanSubscope(subscope);
      },
      {
        [subscopeSym]: {
          subscope,
        },
      }
    );
  }

  subscope(f: () => void, opts?: SubscopeOptions): Destructor {
    return this._subscopeInner(() => f(), opts);
  }

  get<T>(context: ScopeContext<T>): T;
  get<T>(signal: OptionalSignal<T>): T;
  get<T>(arg: OptionalSignal<T> | ScopeContext<T>): T {
    if (arg instanceof ScopeContext<T>) {
      return this.currentSubscope.getContext(arg);
    }

    return typeof arg === "function" && arg.length === 0
      ? (arg as SignalLike<T>)()
      : (arg as T);
  }

  private _cleanEffect(effect: Effect): void {
    effect[effectSym].deleted = true;

    for (const signal of effect[effectSym].dependencies) {
      const index = signal[signalSym].listeners.indexOf(effect);
      if (index >= 0) {
        signal[signalSym].listeners.splice(index, 1);
      }
    }
  }

  private _cleanSubscope(subscope: Subscope): void {
    if (subscope.parent != null) {
      const index = subscope.parent.subscopes.indexOf(subscope);
      if (index >= 0) {
        subscope.parent.subscopes.splice(index, 1);
      }
    }

    // Run cleanups

    for (const cleanup of subscope.cleanups) {
      cleanup();
    }

    subscope.cleanups.length = 0;

    // Clean signals

    for (const signal of subscope.signals) {
      signal[signalSym].deleted = true;
    }

    subscope.signals.length = 0;

    // Clean effects

    for (const effect of subscope.effects) {
      this._cleanEffect(effect);
    }

    subscope.effects.length = 0;

    // Clean subscopes

    for (const subsubscope of subscope.subscopes) {
      this._cleanSubscope(subsubscope);
    }

    subscope.subscopes.length = 0;
  }

  batch<T>(f: () => T): T {
    let startBatch = this.currentBatch == null;

    if (startBatch) {
      this.currentBatch = {
        signals: [],
        effects: [],
      };
    }

    let result = f();

    if (startBatch) {
      while (
        this.currentBatch!.signals.length > 0 ||
        this.currentBatch!.effects.length > 0
      ) {
        // Clean effect subscope

        const effects = this.currentBatch!.effects;
        this.currentBatch!.effects = [];

        for (const effect of effects) {
          effect[effectSym].clean();
          effect[effectSym].clean = () => {};
        }

        // Run signal updates

        for (const [signal, value] of this.currentBatch!.signals) {
          signal[signalSym].value = value;
        }

        this.currentBatch!.signals = [];

        // Run effects

        for (const effect of effects) {
          effect();
        }
      }

      this.currentBatch = undefined;
    }

    return result;
  }

  memo<T>(f: () => T, opts?: SignalSetOptions): Signal<T> {
    let firstTime = true;
    const [signal, setSignal] = this.signal<T>();

    this.effect(() => {
      if (firstTime) {
        signal[signalSym].value = f();
        firstTime = false;
      } else {
        setSignal(f(), opts);
      }
    });

    return signal as Signal<T>;
  }
}
