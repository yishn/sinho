import { JSDOM } from "jsdom";

export function prepare(): void {
  const dom = new JSDOM();
  const globalDomElements: (keyof typeof globalThis)[] = [
    "document",
    "HTMLElement",
    "Node",
    "CustomEvent",
    "customElements",
  ];

  for (const key of globalDomElements) {
    (globalThis as any)[key] = dom.window[key];
  }
}
