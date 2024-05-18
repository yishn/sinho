import { Text } from "./Text.js";
import { FunctionalComponent } from "../component.js";
import { createTemplate, Template } from "../template.js";
import { useMemo, type MaybeSignal } from "../scope.js";

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
 * render() {
 *   return (
 *     <>
 *       <h1>Hello World</h1>
 *       <p>This is a paragraph.</p>
 *     </>
 *   );
 * }
 * ```
 */
export const Fragment: FunctionalComponent<{
  children?: Children;
}> = ({ children }) =>
  createTemplate(() => {
    const arr = !Array.isArray(children)
      ? children == null
        ? []
        : [
            typeof children == "object"
              ? children.build()
              : Text({ text: children }).build(),
          ]
      : children.flatMap((children) => Fragment({ children }).build());

    return useMemo(() => arr.flatMap((signal) => signal()));
  });
