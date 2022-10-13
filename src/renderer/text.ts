import { SignalLike } from "../scope.ts";
import { SpecificComponent } from "./component.ts";

export class TextComponent extends SpecificComponent<
  SignalLike<string | number>
> {}

export function text(
  value: string | number | SignalLike<string | number>
): TextComponent {
  return new TextComponent(typeof value === "function" ? value : () => value);
}
