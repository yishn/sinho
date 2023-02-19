import { Ui5ControlConstructor } from "./ui5_renderer.ts";

export async function sapRequireControl(
  path: string
): Promise<Ui5ControlConstructor> {
  return new Promise((resolve) =>
    // @ts-ignore
    sap.ui.require([path], (Control) => resolve(Control))
  );
}

export function capitalize(value: string): string {
  return value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);
}

export function uncapitalize(value: string): string {
  return value.length === 0 ? value : value[0].toLowerCase() + value.slice(1);
}
