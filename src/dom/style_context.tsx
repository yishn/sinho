/**
 * @jsx s.createComponent
 * @jsxFrag Fragment
 */

import {
  createContext,
  Children,
  Component,
  Fragment,
  FunctionComponent,
  For,
  When,
} from "../mod.ts";
import { DomRenderer } from "./dom_renderer.ts";

type ComponentType<P = any> =
  | (new (props: P) => Component<P, DomRenderer>)
  | FunctionComponent<P, DomRenderer>;

type ComponentStyles<T> = {
  component: ComponentType;
  css: (value: T) => string;
}[];

export interface StyleProviderProps<T> {
  value?: T;
  children?: Children<DomRenderer>;
}

export interface StyleContext<T> {
  Provider: FunctionComponent<StyleProviderProps<T>, DomRenderer>;
  createStyledComponent<P>(
    Component: ComponentType<P>,
    css: (value: T) => string
  ): FunctionComponent<P, DomRenderer>;
}

export function createStyleContext<T>(): StyleContext<T | undefined>;
export function createStyleContext<T>(defaultValue: T): StyleContext<T>;
export function createStyleContext<T>(
  defaultValue?: T
): StyleContext<T | undefined> {
  const componentStyles: ComponentStyles<T | undefined> = [];

  const StylesContext = createContext<{
    setRefCount?: (
      Component: ComponentType,
      mutate: (count: number) => number
    ) => void;
  }>({});

  return {
    Provider: (props, s) => {
      const [refCounts, setRefCounts] = s.signal(
        new Map<ComponentType, number>()
      );

      return (
        <StylesContext.Provider
          value={{
            setRefCount: (Component, mutate) => {
              setRefCounts(
                (map) => {
                  const refCount = map.get(Component) ?? 0;
                  map.set(Component, mutate(refCount));
                  return map;
                },
                { force: true }
              );
            },
          }}
        >
          <>{props.children}</>

          <For source={() => componentStyles}>
            {(componentStyle) => (
              <When
                condition={() =>
                  (refCounts().get(componentStyle().component) ?? 0) > 0
                }
                then={() => (
                  <style>
                    {() => componentStyle().css(props.value ?? defaultValue)}
                  </style>
                )}
              />
            )}
          </For>
        </StylesContext.Provider>
      );
    },
    createStyledComponent(Component, css) {
      componentStyles.push({ component: Component, css });

      return (props, s) => {
        const { setRefCount } = s.context(StylesContext);

        s.effect(() => {
          setRefCount?.(Component, (count) => count + 1);

          s.cleanup(() => {
            setRefCount?.(Component, (count) => count - 1);
          });
        });

        return <Component {...props} />;
      };
    },
  };
}
