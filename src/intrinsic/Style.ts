import { createElement } from "../create_element.js";
import { FunctionalComponent } from "../component.js";
import { Text } from "./Text.js";
import { MaybeSignal, SignalLike } from "../scope.js";

export const Style: FunctionalComponent<{
  css?: MaybeSignal<string>;
}> = (props) =>
  createElement(
    "style",
    {},
    Text({
      text: props.css,
      marker: false,
    }),
  );

export const css = (
  strings: TemplateStringsArray,
  ...values: MaybeSignal<string | number>[]
): SignalLike<string> => {
  return () =>
    strings.reduce(
      (acc, string, i) => acc + string + (MaybeSignal.get(values[i]) ?? ""),
      "",
    );
};
