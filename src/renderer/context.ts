import { ScopeContext, Scope } from "../scope.ts";
import { Children, Component } from "./component.ts";
import { Fragment } from "./fragment.ts";
import { Renderer } from "./renderer.ts";
import { RendererScope } from "./renderer_scope.ts";
import { Rendering } from "./rendering.ts";

export interface ProviderProps<T> {
  value: T;
  children?: Children;
}

export interface Context<T> extends ScopeContext<T> {
  Provider: new (props: ProviderProps<T>) => Component<ProviderProps<T>>;
}

export function createContext<T>(): Context<T | undefined>;
export function createContext<T>(defaultValue: T): Context<T>;
export function createContext<T>(defaultValue?: T): Context<T | undefined> {
  const context = Scope.context(defaultValue);

  return Object.assign(context, {
    Provider: class Provider extends Component<ProviderProps<T | undefined>> {
      render<R extends Renderer>(s: RendererScope<R>): Rendering<R> {
        let result: Rendering<R>;

        context.provide(s, this.props.value, () => {
          result = new Fragment({
            children: this.props.children,
          }).render(s);
        });

        return result!;
      }
    },
  });
}
