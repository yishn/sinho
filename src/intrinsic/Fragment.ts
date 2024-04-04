import { Text } from "./Text.js";
import { FunctionalComponent } from "../component.js";
import { createTemplate, Template } from "../template.js";
import type { MaybeSignal } from "../scope.js";

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
 *   <>
 *     <h1>Hello World</h1>
 *     <p>This is a paragraph.</p>
 *   </>
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
          : Text({ text: children })
      : children.flatMap((children) => Fragment({ children }).build());
  });
