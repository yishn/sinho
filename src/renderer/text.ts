import { SignalLike } from "../scope.ts";
import { SpecificComponent } from "./component.ts";

export class Text extends SpecificComponent<SignalLike<string | number>> {}

export function text(
  value: string | number | SignalLike<string | number>
): Text {
  return new Text(typeof value === "function" ? value : () => value);
}
