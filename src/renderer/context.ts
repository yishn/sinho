import { Children, Component } from "./component.ts";
import { Fragment } from "./fragment.ts";
import { Renderer, RendererScope, Rendering } from "./renderer.ts";

export interface ProviderProps<T, R extends Renderer = any> {
  value: T;
  children?: Children<R>;
}

export interface Context<T> {
  Provider: new (props: ProviderProps<T>) => Component;
  defaultValue: T;
}

class ContextInner<T> implements Context<T> {
  protected currentValue: T | undefined;

  Provider = (() => {
    const context = this;

    return class Provider extends Component<ProviderProps<T>, any> {
      render(s: RendererScope<any>): Rendering<any> {
        const previousValue = context.currentValue;
        context.currentValue = this.props.value;

        const result = new Fragment({
          children: this.props.children,
        }).render(s);

        context.currentValue = previousValue;
        return result;
      }
    };
  })();

  constructor(public defaultValue: T) {}

  get(): T {
    return this.currentValue ?? this.defaultValue;
  }
}

export function createContext<T>(): Context<T | undefined>;
export function createContext<T>(defaultValue: T): Context<T>;
export function createContext<T>(defaultValue?: T): Context<T | undefined> {
  return new ContextInner(defaultValue);
}

export function useContext<T>(context: Context<T>): T {
  return (context as ContextInner<T>).get();
}
