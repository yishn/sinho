import { Scope } from "../scope.ts";
import { Component } from "./component.ts";
import { Renderer } from "./renderer.ts";

export const _globals: { s?: RendererScope<Renderer> } = {};

export class RendererScope<out R extends Renderer> extends Scope {
  _current: Component<any, R> | undefined;

  constructor(public renderer: R) {
    super();
  }

  pin<P extends any[], T>(f: (...args: P) => T): (...args: P) => T {
    const currentRendererScope = _globals.s;
    const g = Scope.prototype.pin.call(this, f as any) as (...args: P) => T;

    return (...args) => {
      const prevRendererScope = _globals.s;
      _globals.s = currentRendererScope;

      const result = g(...args);

      _globals.s = prevRendererScope;
      return result;
    };
  }

  onMount(f: () => void): void {
    if (this._current == null) return;

    let listeners = this.renderer._mountListeners.get(this._current);

    if (listeners == null) {
      listeners = [];
      this.renderer._mountListeners.set(this._current, listeners);
    }

    listeners.push(
      this.pin(() => {
        this.batch(() => {
          f();
        });
      })
    );
  }
}

export function getCurrentRendererScope(): RendererScope<Renderer> {
  const result = _globals.s;

  if (result == null) {
    throw new Error("no current renderer scope available");
  }

  return result;
}
