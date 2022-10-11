const signalSym = Symbol("signal");
const effectSym = Symbol("effect");
const subscopeSym = Symbol("subscope");

interface SignalInner<out T> {
  [signalSym]: {
    value: T;
    listeners: Effect[];
  };
}

export interface Signal<out T> extends SignalInner<T> {
  (): T;
  peek(): T;
  track(): void;
}

export interface SignalSetOptions {
  force?: boolean;
  silent?: boolean;
}

export interface SignalSetter<in out T> {
  (value: T, opts?: SignalSetOptions): void;
  (update: (value: T) => T, opts?: SignalSetOptions): void;
}

interface EffectInner {
  [effectSym]: {
    clean: SubscopeDestructor;
    dependencies: Signal<any>[];
  };
}

interface Effect extends EffectInner {
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
  signals: Signal<any>[] = [];
  effects: Effect[] = [];
  cleanups: Cleanup[] = [];
  subscopes: Subscope[] = [];
}

export interface SubscopeOptions {
  leaked?: boolean;
}

interface SubscopeDestructorInner {
  [subscopeSym]?: {
    subscope: Subscope;
  };
}

export interface SubscopeDestructor extends SubscopeDestructorInner {
  (): void;
}

export class Scope {
  private currentSubscope: Subscope = new Subscope();
  private currentUntracked: boolean = false;
  private currentEffect?: Effect;
  private currentBatch?: {
    signals: [signal: Signal<any>, value: any][];
    effects: Effect[];
  };

  signal<T>(value: T): [Signal<T>, SignalSetter<T>] {
    const signal: Signal<T> = Object.assign(
      (): T => {
        if (!this.currentUntracked) {
          signal.track();
        }

        return signal.peek();
      },
      {
        peek: () => {
          return signal[signalSym].value;
        },
        track: () => {
          if (this.currentEffect != null) {
            if (!signal[signalSym].listeners.includes(this.currentEffect)) {
              signal[signalSym].listeners.push(this.currentEffect);
            }

            if (!this.currentEffect[effectSym].dependencies.includes(signal)) {
              this.currentEffect[effectSym].dependencies.push(signal);
            }
          }
        },
        [signalSym]: {
          value,
          listeners: [],
        },
      }
    );

    this.currentSubscope.signals.push(signal);

    const setter = (arg: T | ((value: T) => T), opts?: SignalSetOptions) => {
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
        this.batch(() => setter(arg as any));
      }
    };

    return [signal, setter];
  }

  effect(f: () => void, opts?: EffectOptions): void {
    const effect: Effect = Object.assign(
      () => {
        let effectData = effect[effectSym];

        // Clean up dependencies and listeners

        for (const signal of effectData.dependencies) {
          const index = signal[signalSym].listeners.indexOf(effect);
          if (index >= 0) {
            signal[signalSym].listeners.splice(index, 1);
          }
        }

        effectData.dependencies = [];

        // Run effect and make sure states are taken care of

        let prevUntracked = this.currentUntracked;
        let prevEffect = this.currentEffect;
        this.currentUntracked = !!opts?.untracked;
        this.currentEffect = effect;

        effectData.clean = this.subscope(() => {
          this.batch(() => {
            f();
          });
        });

        this.currentUntracked = prevUntracked;
        this.currentEffect = prevEffect;
      },
      {
        [effectSym]: {
          clean: () => {},
          dependencies: [],
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

  subscope(f: () => void, opts?: SubscopeOptions): SubscopeDestructor {
    const subscope = new Subscope();
    const prevSubscope = this.currentSubscope;
    this.currentSubscope = subscope;

    if (!opts?.leaked) {
      prevSubscope.subscopes.push(subscope);
      subscope.parent = prevSubscope;
    }

    f();

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

  private _cleanEffect(effect: Effect): void {
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

  memo<T>(f: () => T): Signal<T> {
    const [signal, setSignal] = this.signal<T>(undefined as T);

    this.effect(() => setSignal(f()));

    return signal;
  }
}
