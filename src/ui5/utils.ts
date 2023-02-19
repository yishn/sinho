import { Ui5Control } from "./ui5_renderer.ts";

export async function sapRequire<A>(import1: string): Promise<[A]>;
export async function sapRequire<A, B>(
  import1: string,
  import2: string
): Promise<[A, B]>;
export async function sapRequire<A, B, C>(
  import1: string,
  import2: string,
  import3: string
): Promise<[A, B, C]>;
export async function sapRequire<A, B, C, D>(
  import1: string,
  import2: string,
  import3: string,
  import4: string
): Promise<[A, B, C, D]>;
export async function sapRequire<A, B, C, D, E>(
  import1: string,
  import2: string,
  import3: string,
  import4: string,
  import5: string
): Promise<[A, B, C, D, E]>;
export async function sapRequire<A, B, C, D, E, F>(
  import1: string,
  import2: string,
  import3: string,
  import4: string,
  import5: string,
  import6: string
): Promise<[A, B, C, D, E, F]>;
export async function sapRequire(...imports: string[]): Promise<unknown[]> {
  return new Promise((resolve) =>
    // @ts-ignore
    sap.ui.require(imports, (...args) => resolve(args))
  );
}

export const Marker = (async function () {
  const [Control] = await sapRequire<
    (new () => Ui5Control) & {
      extend(
        name: string,
        props: { renderer: () => void }
      ): new () => Ui5Control;
    }
  >("sap/ui/core/Control");

  return Control.extend("shingo.Marker", {
    renderer: () => {},
  });
})();

export function capitalize(value: string): string {
  return value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);
}

export function uncapitalize(value: string): string {
  return value.length === 0 ? value : value[0].toLowerCase() + value.slice(1);
}
