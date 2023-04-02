/**
 * @jsx s.createComponent
 * @jsxFrag Fragment
 */

import {
  createContext,
  Children,
  FunctionComponent,
  When,
  Fragment,
  ComponentType,
} from "../mod.ts";
import { OptionalSignal } from "../scope.ts";
import { DomRenderer } from "./dom_renderer.ts";

type ComponentStyles<T> = {
  namespace: string;
  component: ComponentType<any, DomRenderer>;
  css: (value: T, namespace: string) => string;
}[];

export interface StyleProviderProps<T> {
  value?: T;
  children?: Children<DomRenderer>;
}

export interface StyleContext<T> {
  Provider: FunctionComponent<StyleProviderProps<T>, DomRenderer>;
  createStyledComponent<
    P extends { class?: OptionalSignal<string | undefined> }
  >(
    Component: ComponentType<P, DomRenderer>,
    css: (value: T, namespace: string) => string
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
      Component: ComponentType<any, DomRenderer>,
      mutate: (count: number) => number
    ) => void;
  }>({});

  return {
    Provider: (props, s) => {
      const [refCounts, setRefCounts] = s.signal(
        new Map<ComponentType<any, DomRenderer>, number>()
      );

      s.onMount(() => {
        const stylesRendering = new Fragment({
          children: componentStyles.map((componentStyle) => (
            <When
              condition={() =>
                (refCounts().get(componentStyle.component) ?? 0) > 0
              }
              then={
                <style>
                  {() =>
                    componentStyle.css(
                      props.value ?? defaultValue,
                      componentStyle.namespace
                    )
                  }
                </style>
              }
            />
          )),
        }).render(s);

        s.renderer.appendRendering(stylesRendering, document.head);

        s.cleanup(() => s.renderer.removeRendering(stylesRendering));
      });

      return (
        <StylesContext.Provider
          value={{
            setRefCount: (Component, mutate) => {
              setRefCounts(
                (map) => {
                  const refCount = map.get(Component) ?? 0;
                  return map.set(Component, mutate(refCount));
                },
                { force: true }
              );
            },
          }}
        >
          {props.children}
        </StylesContext.Provider>
      );
    },
    createStyledComponent(Component, css) {
      const namespace = "n" + crypto.randomUUID().replace(/\W/g, "");

      componentStyles.push({
        namespace,
        component: Component,
        css,
      });

      return (props, s) => {
        const { setRefCount } = s.get(StylesContext);

        s.effect(() => {
          setRefCount?.(Component, (count) => count + 1);

          s.cleanup(() => {
            setRefCount?.(Component, (count) => count - 1);
          });
        });

        return (
          <Component
            {...props}
            class={() => (s.get(props.class) ?? "") + " " + (namespace ?? "")}
          />
        );
      };
    },
  };
}
