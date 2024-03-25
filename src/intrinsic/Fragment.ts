import { Text } from "./Text.js";
import { FunctionalComponent, MaybeSignal, Template } from "../mod.js";
import { createTemplate } from "../renderer.js";

export type Children =
  | Template
  | MaybeSignal<string | number | null | undefined>
  | Children[];

/**
 * Fragment is a component that can be used to wrap multiple children without
 * introducing an extra DOM element.
 *
 * @example
 * ```tsx
 * const App = () => (
 *   ‹›
 *     ‹h1›Hello World‹/h1›
 *     ‹p›This is a paragraph.‹/p›
 *   ‹/›
 * );
 * ```
 */
export const Fragment: FunctionalComponent<{
  children?: Children;
}> = ({ children }) =>
  createTemplate(() => {
    return !Array.isArray(children)
      ? children == null
        ? []
        : typeof children == "object"
          ? children
          : Text({ children })
      : children.flatMap((children) => Fragment({ children }).build());
  });
