import { Component } from "../mod.ts";
import type { DomRenderer } from "./dom_renderer.ts";

export * from "./dom_renderer.ts";
export * from "./tag.ts";

export abstract class DomComponent<P = any> extends Component<P, DomRenderer> {}
