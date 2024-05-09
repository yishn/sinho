/*
 * The following functions are lifted from Preact <https://preactjs.com/> and
 * modified.
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2015-present Jason Miller
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import {
  type Children,
  type MaybeSignal,
  type RefSignalSetter,
} from "./mod.js";
import { isComponent } from "./component.js";

const IS_NON_DIMENSIONAL =
  /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;

export const setStyle = (
  node: ElementCSSInlineStyle,
  key: any,
  value: string | number | null | undefined,
): void => {
  if (key[0] == "-") {
    node.style.setProperty(key, `${value}`);
  } else {
    node.style[key] =
      value == null
        ? ""
        : typeof value != "number" || IS_NON_DIMENSIONAL.test(key)
          ? `${value}`
          : `${value}px`;
  }
};

export const setAttr = (
  node: any,
  name: string,
  value: unknown,
  heuristic?: boolean,
): void => {
  const removeAttribute =
    value == null || (value === false && !name.includes("-"));

  if (name.startsWith("prop:")) {
    node[name.slice(5)] = value;
  } else if (name.startsWith("attr:")) {
    name = name.slice(5);
    if (!removeAttribute) {
      node.setAttribute(name, value);
    } else {
      node.removeAttribute(name);
    }
  } else if (!["innerHTML", "outerHTML"].includes(name)) {
    if (
      ![
        // Default value in browsers is `-1` and an empty string is
        // cast to `0` instead
        "tabIndex",
        "role",
        ...(heuristic
          ? [
              "width",
              "height",
              "href",
              "list",
              "form",
              "download",
              "rowSpan",
              "colSpan",
            ]
          : []),
      ].includes(name) &&
      name in node
    ) {
      try {
        if (isComponent(node)) {
          (node as any)[name] = value;
        } else {
          node[name] = value == null ? "" : value;
        }
        return;
      } catch (e) {}
    }

    // aria- and data- attributes have no boolean representation.
    // A `false` value is different from the attribute not being
    // present, so we can't remove it. For non-boolean aria
    // attributes we could treat false as a removal, but the
    // amount of exceptions would cost too many bytes. On top of
    // that other frameworks generally stringify `false`.

    if (typeof value == "function") {
      // never serialize functions as attribute values
    } else if (!removeAttribute) {
      node.setAttribute(name, value);
    } else {
      node.removeAttribute(name);
    }
  }
};

export interface DomIntrinsicElements {
  // HTML
  a: HtmlProps<HTMLAnchorElement> & DomEventProps<HTMLAnchorElement>;
  abbr: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  address: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  area: HtmlProps<HTMLAreaElement> & DomEventProps<HTMLAreaElement>;
  article: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  aside: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  audio: HtmlProps<HTMLAudioElement> & DomEventProps<HTMLAudioElement>;
  b: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  base: HtmlProps<HTMLBaseElement> & DomEventProps<HTMLBaseElement>;
  bdi: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  bdo: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  big: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  blockquote: HtmlProps<HTMLQuoteElement> & DomEventProps<HTMLQuoteElement>;
  body: HtmlProps<HTMLBodyElement> & DomEventProps<HTMLBodyElement>;
  br: HtmlProps<HTMLBRElement> & DomEventProps<HTMLBRElement>;
  button: HtmlProps<HTMLButtonElement> & DomEventProps<HTMLButtonElement>;
  canvas: HtmlProps<HTMLCanvasElement> & DomEventProps<HTMLCanvasElement>;
  caption: HtmlProps<HTMLTableCaptionElement> &
    DomEventProps<HTMLTableCaptionElement>;
  cite: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  code: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  col: HtmlProps<HTMLTableColElement> & DomEventProps<HTMLTableColElement>;
  colgroup: HtmlProps<HTMLTableColElement> & DomEventProps<HTMLTableColElement>;
  data: HtmlProps<HTMLDataElement> & DomEventProps<HTMLDataElement>;
  datalist: HtmlProps<HTMLDataListElement> & DomEventProps<HTMLDataListElement>;
  dd: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  del: HtmlProps<HTMLModElement> & DomEventProps<HTMLModElement>;
  details: HtmlProps<HTMLDetailsElement> & DomEventProps<HTMLDetailsElement>;
  dfn: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  dialog: HtmlProps<HTMLDialogElement> & DomEventProps<HTMLDialogElement>;
  div: HtmlProps<HTMLDivElement> & DomEventProps<HTMLDivElement>;
  dl: HtmlProps<HTMLDListElement> & DomEventProps<HTMLDListElement>;
  dt: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  em: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  embed: HtmlProps<HTMLEmbedElement> & DomEventProps<HTMLEmbedElement>;
  fieldset: HtmlProps<HTMLFieldSetElement> & DomEventProps<HTMLFieldSetElement>;
  figcaption: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  figure: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  footer: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  form: HtmlProps<HTMLFormElement> & DomEventProps<HTMLFormElement>;
  h1: HtmlProps<HTMLHeadingElement> & DomEventProps<HTMLHeadingElement>;
  h2: HtmlProps<HTMLHeadingElement> & DomEventProps<HTMLHeadingElement>;
  h3: HtmlProps<HTMLHeadingElement> & DomEventProps<HTMLHeadingElement>;
  h4: HtmlProps<HTMLHeadingElement> & DomEventProps<HTMLHeadingElement>;
  h5: HtmlProps<HTMLHeadingElement> & DomEventProps<HTMLHeadingElement>;
  h6: HtmlProps<HTMLHeadingElement> & DomEventProps<HTMLHeadingElement>;
  head: HtmlProps<HTMLHeadElement> & DomEventProps<HTMLHeadElement>;
  header: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  hgroup: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  hr: HtmlProps<HTMLHRElement> & DomEventProps<HTMLHRElement>;
  html: HtmlProps<HTMLHtmlElement> & DomEventProps<HTMLHtmlElement>;
  i: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  iframe: HtmlProps<HTMLIFrameElement> & DomEventProps<HTMLIFrameElement>;
  img: HtmlProps<HTMLImageElement> & DomEventProps<HTMLImageElement>;
  input: HtmlProps<HTMLInputElement> & DomEventProps<HTMLInputElement>;
  ins: HtmlProps<HTMLModElement> & DomEventProps<HTMLModElement>;
  kbd: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  keygen: HtmlProps<HTMLUnknownElement> & DomEventProps<HTMLUnknownElement>;
  label: HtmlProps<HTMLLabelElement> & DomEventProps<HTMLLabelElement>;
  legend: HtmlProps<HTMLLegendElement> & DomEventProps<HTMLLegendElement>;
  li: HtmlProps<HTMLLIElement> & DomEventProps<HTMLLIElement>;
  link: HtmlProps<HTMLLinkElement> & DomEventProps<HTMLLinkElement>;
  main: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  map: HtmlProps<HTMLMapElement> & DomEventProps<HTMLMapElement>;
  mark: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  marquee: HtmlProps<HTMLMarqueeElement> & DomEventProps<HTMLMarqueeElement>;
  menu: HtmlProps<HTMLMenuElement> & DomEventProps<HTMLMenuElement>;
  menuitem: HtmlProps<HTMLUnknownElement> & DomEventProps<HTMLUnknownElement>;
  meta: HtmlProps<HTMLMetaElement> & DomEventProps<HTMLMetaElement>;
  meter: HtmlProps<HTMLMeterElement> & DomEventProps<HTMLMeterElement>;
  nav: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  noscript: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  object: HtmlProps<HTMLObjectElement> & DomEventProps<HTMLObjectElement>;
  ol: HtmlProps<HTMLOListElement> & DomEventProps<HTMLOListElement>;
  optgroup: HtmlProps<HTMLOptGroupElement> & DomEventProps<HTMLOptGroupElement>;
  option: HtmlProps<HTMLOptionElement> & DomEventProps<HTMLOptionElement>;
  output: HtmlProps<HTMLOutputElement> & DomEventProps<HTMLOutputElement>;
  p: HtmlProps<HTMLParagraphElement> & DomEventProps<HTMLParagraphElement>;
  param: HtmlProps<HTMLParamElement> & DomEventProps<HTMLParamElement>;
  picture: HtmlProps<HTMLPictureElement> & DomEventProps<HTMLPictureElement>;
  pre: HtmlProps<HTMLPreElement> & DomEventProps<HTMLPreElement>;
  progress: HtmlProps<HTMLProgressElement> & DomEventProps<HTMLProgressElement>;
  q: HtmlProps<HTMLQuoteElement> & DomEventProps<HTMLQuoteElement>;
  rp: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  rt: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  ruby: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  s: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  samp: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  script: HtmlProps<HTMLScriptElement> & DomEventProps<HTMLScriptElement>;
  section: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  select: HtmlProps<HTMLSelectElement> & DomEventProps<HTMLSelectElement>;
  slot: HtmlProps<HTMLSlotElement> & DomEventProps<HTMLSlotElement>;
  small: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  source: HtmlProps<HTMLSourceElement> & DomEventProps<HTMLSourceElement>;
  span: HtmlProps<HTMLSpanElement> & DomEventProps<HTMLSpanElement>;
  strong: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  style: HtmlProps<HTMLStyleElement> & DomEventProps<HTMLStyleElement>;
  sub: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  summary: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  sup: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  table: HtmlProps<HTMLTableElement> & DomEventProps<HTMLTableElement>;
  tbody: HtmlProps<HTMLTableSectionElement> &
    DomEventProps<HTMLTableSectionElement>;
  td: HtmlProps<HTMLTableCellElement> & DomEventProps<HTMLTableCellElement>;
  textarea: HtmlProps<HTMLTextAreaElement> & DomEventProps<HTMLTextAreaElement>;
  tfoot: HtmlProps<HTMLTableSectionElement> &
    DomEventProps<HTMLTableSectionElement>;
  th: HtmlProps<HTMLTableCellElement> & DomEventProps<HTMLTableCellElement>;
  thead: HtmlProps<HTMLTableSectionElement> &
    DomEventProps<HTMLTableSectionElement>;
  time: HtmlProps<HTMLTimeElement> & DomEventProps<HTMLTimeElement>;
  title: HtmlProps<HTMLTitleElement> & DomEventProps<HTMLTitleElement>;
  tr: HtmlProps<HTMLTableRowElement> & DomEventProps<HTMLTableRowElement>;
  track: HtmlProps<HTMLTrackElement> & DomEventProps<HTMLTrackElement>;
  u: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  ul: HtmlProps<HTMLUListElement> & DomEventProps<HTMLUListElement>;
  var: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;
  video: HtmlProps<HTMLVideoElement> & DomEventProps<HTMLVideoElement>;
  wbr: HtmlProps<HTMLElement> & DomEventProps<HTMLElement>;

  //SVG
  svg: SvgProps<SVGSVGElement> & DomEventProps<SVGSVGElement>;
  animate: SvgProps<SVGAnimateElement> & DomEventProps<SVGAnimateElement>;
  circle: SvgProps<SVGCircleElement> & DomEventProps<SVGCircleElement>;
  animateTransform: SvgProps<SVGAnimateElement> &
    DomEventProps<SVGAnimateElement>;
  clipPath: SvgProps<SVGClipPathElement> & DomEventProps<SVGClipPathElement>;
  defs: SvgProps<SVGDefsElement> & DomEventProps<SVGDefsElement>;
  desc: SvgProps<SVGDescElement> & DomEventProps<SVGDescElement>;
  ellipse: SvgProps<SVGEllipseElement> & DomEventProps<SVGEllipseElement>;
  feBlend: SvgProps<SVGFEBlendElement> & DomEventProps<SVGFEBlendElement>;
  feColorMatrix: SvgProps<SVGFEColorMatrixElement> &
    DomEventProps<SVGFEColorMatrixElement>;
  feComponentTransfer: SvgProps<SVGFEComponentTransferElement> &
    DomEventProps<SVGFEComponentTransferElement>;
  feComposite: SvgProps<SVGFECompositeElement> &
    DomEventProps<SVGFECompositeElement>;
  feConvolveMatrix: SvgProps<SVGFEConvolveMatrixElement> &
    DomEventProps<SVGFEConvolveMatrixElement>;
  feDiffuseLighting: SvgProps<SVGFEDiffuseLightingElement> &
    DomEventProps<SVGFEDiffuseLightingElement>;
  feDisplacementMap: SvgProps<SVGFEDisplacementMapElement> &
    DomEventProps<SVGFEDisplacementMapElement>;
  feDropShadow: SvgProps<SVGFEDropShadowElement> &
    DomEventProps<SVGFEDropShadowElement>;
  feFlood: SvgProps<SVGFEFloodElement> & DomEventProps<SVGFEFloodElement>;
  feFuncA: SvgProps<SVGFEFuncAElement> & DomEventProps<SVGFEFuncAElement>;
  feFuncB: SvgProps<SVGFEFuncBElement> & DomEventProps<SVGFEFuncBElement>;
  feFuncG: SvgProps<SVGFEFuncGElement> & DomEventProps<SVGFEFuncGElement>;
  feFuncR: SvgProps<SVGFEFuncRElement> & DomEventProps<SVGFEFuncRElement>;
  feGaussianBlur: SvgProps<SVGFEGaussianBlurElement> &
    DomEventProps<SVGFEGaussianBlurElement>;
  feImage: SvgProps<SVGFEImageElement> & DomEventProps<SVGFEImageElement>;
  feMerge: SvgProps<SVGFEMergeElement> & DomEventProps<SVGFEMergeElement>;
  feMergeNode: SvgProps<SVGFEMergeNodeElement> &
    DomEventProps<SVGFEMergeNodeElement>;
  feMorphology: SvgProps<SVGFEMorphologyElement> &
    DomEventProps<SVGFEMorphologyElement>;
  feOffset: SvgProps<SVGFEOffsetElement> & DomEventProps<SVGFEOffsetElement>;
  feSpecularLighting: SvgProps<SVGFESpecularLightingElement> &
    DomEventProps<SVGFESpecularLightingElement>;
  feTile: SvgProps<SVGFETileElement> & DomEventProps<SVGFETileElement>;
  feTurbulence: SvgProps<SVGFETurbulenceElement> &
    DomEventProps<SVGFETurbulenceElement>;
  filter: SvgProps<SVGFilterElement> & DomEventProps<SVGFilterElement>;
  foreignObject: SvgProps<SVGForeignObjectElement> &
    DomEventProps<SVGForeignObjectElement>;
  g: SvgProps<SVGGElement> & DomEventProps<SVGGElement>;
  image: SvgProps<SVGImageElement> & DomEventProps<SVGImageElement>;
  line: SvgProps<SVGLineElement> & DomEventProps<SVGLineElement>;
  linearGradient: SvgProps<SVGLinearGradientElement> &
    DomEventProps<SVGLinearGradientElement>;
  marker: SvgProps<SVGMarkerElement> & DomEventProps<SVGMarkerElement>;
  mask: SvgProps<SVGMaskElement> & DomEventProps<SVGMaskElement>;
  path: SvgProps<SVGPathElement> & DomEventProps<SVGPathElement>;
  pattern: SvgProps<SVGPatternElement> & DomEventProps<SVGPatternElement>;
  polygon: SvgProps<SVGPolygonElement> & DomEventProps<SVGPolygonElement>;
  polyline: SvgProps<SVGPolylineElement> & DomEventProps<SVGPolylineElement>;
  radialGradient: SvgProps<SVGRadialGradientElement> &
    DomEventProps<SVGRadialGradientElement>;
  rect: SvgProps<SVGRectElement> & DomEventProps<SVGRectElement>;
  stop: SvgProps<SVGStopElement> & DomEventProps<SVGStopElement>;
  symbol: SvgProps<SVGSymbolElement> & DomEventProps<SVGSymbolElement>;
  text: SvgProps<SVGTextElement> & DomEventProps<SVGTextElement>;
  textPath: SvgProps<SVGTextPathElement> & DomEventProps<SVGTextPathElement>;
  tspan: SvgProps<SVGTSpanElement> & DomEventProps<SVGTSpanElement>;
  use: SvgProps<SVGUseElement> & DomEventProps<SVGUseElement>;

  [tagName: string]: DomProps<any> & Record<string, any>;
}

export type Styles = {
  [K in Exclude<
    keyof CSSStyleDeclaration,
    | "item"
    | "setProperty"
    | "removeProperty"
    | "getPropertyValue"
    | "getPropertyPriority"
    | typeof Symbol.iterator
    | number
  >]?: MaybeSignal<string | number | null | undefined>;
} & {
  [key: string]: MaybeSignal<string | number | null | undefined>;
};

type ExcludeNeverValues<T> = T[Exclude<
  keyof T,
  { [K in keyof T]: T[K] extends never ? K : never }[keyof T]
>];

type EventMap = Pick<
  ElementEventMap & DocumentEventMap & GlobalEventHandlersEventMap,
  ExcludeNeverValues<{
    [K in keyof (ElementEventMap &
      DocumentEventMap &
      GlobalEventHandlersEventMap)]: K extends Lowercase<K> ? K : never;
  }>
>;

export type EventHandler<K extends keyof EventMap, E> = (
  this: E,
  evt: Omit<EventMap[K], "currentTarget"> & {
    currentTarget: E;
  },
) => void;

export type DomEventProps<E> = {
  [K in keyof EventMap as `on${K}`]?: EventHandler<K, E>;
};

export interface DangerousHtml {
  __html: string;
}

export interface DomProps<in E> {
  ref?: RefSignalSetter<E | undefined>;
  class?: MaybeSignal<string | undefined>;
  style?: Styles;
  dangerouslySetInnerHTML?: MaybeSignal<DangerousHtml>;
  children?: Children;
}

interface HtmlProps<in E> extends DomProps<E> {
  // Standard HTML Attributes
  accept?: MaybeSignal<string | undefined>;
  acceptCharset?: MaybeSignal<string | undefined>;
  accessKey?: MaybeSignal<string | undefined>;
  action?: MaybeSignal<string | undefined>;
  allow?: MaybeSignal<string | undefined>;
  allowFullScreen?: MaybeSignal<boolean | undefined>;
  allowTransparency?: MaybeSignal<boolean | undefined>;
  alt?: MaybeSignal<string | undefined>;
  as?: MaybeSignal<string | undefined>;
  async?: MaybeSignal<boolean | undefined>;
  autocomplete?: MaybeSignal<string | undefined>;
  autoComplete?: MaybeSignal<string | undefined>;
  autocorrect?: MaybeSignal<string | undefined>;
  autoCorrect?: MaybeSignal<string | undefined>;
  autofocus?: MaybeSignal<boolean | undefined>;
  autoFocus?: MaybeSignal<boolean | undefined>;
  autoPlay?: MaybeSignal<boolean | undefined>;
  capture?: MaybeSignal<string | undefined>;
  cellPadding?: MaybeSignal<string | undefined>;
  cellSpacing?: MaybeSignal<string | undefined>;
  charSet?: MaybeSignal<string | undefined>;
  challenge?: MaybeSignal<string | undefined>;
  checked?: MaybeSignal<boolean | undefined>;
  cite?: MaybeSignal<string | undefined>;
  cols?: MaybeSignal<number | undefined>;
  colSpan?: MaybeSignal<number | undefined>;
  content?: MaybeSignal<string | undefined>;
  contentEditable?: MaybeSignal<boolean | undefined>;
  contextMenu?: MaybeSignal<string | undefined>;
  controls?: MaybeSignal<boolean | undefined>;
  controlsList?: MaybeSignal<string | undefined>;
  coords?: MaybeSignal<string | undefined>;
  crossOrigin?: MaybeSignal<string | undefined>;
  data?: MaybeSignal<string | undefined>;
  dateTime?: MaybeSignal<string | undefined>;
  default?: MaybeSignal<boolean | undefined>;
  defaultChecked?: MaybeSignal<boolean | undefined>;
  defaultValue?: MaybeSignal<string | string[] | number | undefined>;
  defer?: MaybeSignal<boolean | undefined>;
  dir?: MaybeSignal<"auto" | "rtl" | "ltr" | undefined>;
  disabled?: MaybeSignal<boolean | undefined>;
  disableRemotePlayback?: MaybeSignal<boolean | undefined>;
  download?: MaybeSignal<any | undefined>;
  decoding?: MaybeSignal<"sync" | "async" | "auto" | undefined>;
  draggable?: MaybeSignal<boolean | undefined>;
  encType?: MaybeSignal<string | undefined>;
  enterkeyhint?: MaybeSignal<
    | "enter"
    | "done"
    | "go"
    | "next"
    | "previous"
    | "search"
    | "send"
    | undefined
  >;
  for?: MaybeSignal<string | undefined>;
  form?: MaybeSignal<string | undefined>;
  formAction?: MaybeSignal<string | undefined>;
  formEncType?: MaybeSignal<string | undefined>;
  formMethod?: MaybeSignal<string | undefined>;
  formNoValidate?: MaybeSignal<boolean | undefined>;
  formTarget?: MaybeSignal<string | undefined>;
  frameBorder?: MaybeSignal<number | string | undefined>;
  headers?: MaybeSignal<string | undefined>;
  height?: MaybeSignal<number | string | undefined>;
  hidden?: MaybeSignal<boolean | undefined>;
  high?: MaybeSignal<number | undefined>;
  href?: MaybeSignal<string | undefined>;
  hrefLang?: MaybeSignal<string | undefined>;
  httpEquiv?: MaybeSignal<string | undefined>;
  icon?: MaybeSignal<string | undefined>;
  inputMode?: MaybeSignal<string | undefined>;
  integrity?: MaybeSignal<string | undefined>;
  is?: MaybeSignal<string | undefined>;
  keyParams?: MaybeSignal<string | undefined>;
  keyType?: MaybeSignal<string | undefined>;
  kind?: MaybeSignal<string | undefined>;
  label?: MaybeSignal<string | undefined>;
  lang?: MaybeSignal<string | undefined>;
  list?: MaybeSignal<string | undefined>;
  loading?: MaybeSignal<"eager" | "lazy" | undefined>;
  loop?: MaybeSignal<boolean | undefined>;
  low?: MaybeSignal<number | undefined>;
  manifest?: MaybeSignal<string | undefined>;
  marginHeight?: MaybeSignal<number | undefined>;
  marginWidth?: MaybeSignal<number | undefined>;
  max?: MaybeSignal<string | undefined>;
  maxLength?: MaybeSignal<number | undefined>;
  media?: MaybeSignal<string | undefined>;
  mediaGroup?: MaybeSignal<string | undefined>;
  method?: MaybeSignal<string | undefined>;
  min?: MaybeSignal<string | undefined>;
  minLength?: MaybeSignal<number | undefined>;
  multiple?: MaybeSignal<boolean | undefined>;
  muted?: MaybeSignal<boolean | undefined>;
  name?: MaybeSignal<string | undefined>;
  nomodule?: MaybeSignal<boolean | undefined>;
  nonce?: MaybeSignal<string | undefined>;
  noValidate?: MaybeSignal<boolean | undefined>;
  open?: MaybeSignal<boolean | undefined>;
  optimum?: MaybeSignal<number | undefined>;
  part?: MaybeSignal<string | undefined>;
  pattern?: MaybeSignal<string | undefined>;
  ping?: MaybeSignal<string | undefined>;
  placeholder?: MaybeSignal<string | undefined>;
  playsInline?: MaybeSignal<boolean | undefined>;
  poster?: MaybeSignal<string | undefined>;
  preload?: MaybeSignal<string | undefined>;
  radioGroup?: MaybeSignal<string | undefined>;
  readonly?: MaybeSignal<boolean | undefined>;
  readOnly?: MaybeSignal<boolean | undefined>;
  referrerpolicy?: MaybeSignal<
    | "no-referrer"
    | "no-referrer-when-downgrade"
    | "origin"
    | "origin-when-cross-origin"
    | "same-origin"
    | "strict-origin"
    | "strict-origin-when-cross-origin"
    | "unsafe-url"
    | undefined
  >;
  rel?: MaybeSignal<string | undefined>;
  required?: MaybeSignal<boolean | undefined>;
  reversed?: MaybeSignal<boolean | undefined>;
  role?: MaybeSignal<string | undefined>;
  rows?: MaybeSignal<number | undefined>;
  rowSpan?: MaybeSignal<number | undefined>;
  sandbox?: MaybeSignal<string | undefined>;
  scope?: MaybeSignal<string | undefined>;
  scoped?: MaybeSignal<boolean | undefined>;
  scrolling?: MaybeSignal<string | undefined>;
  seamless?: MaybeSignal<boolean | undefined>;
  selected?: MaybeSignal<boolean | undefined>;
  shape?: MaybeSignal<string | undefined>;
  size?: MaybeSignal<number | undefined>;
  sizes?: MaybeSignal<string | undefined>;
  slot?: MaybeSignal<string | undefined>;
  span?: MaybeSignal<number | undefined>;
  spellcheck?: MaybeSignal<boolean | undefined>;
  spellCheck?: MaybeSignal<boolean | undefined>;
  src?: MaybeSignal<string | undefined>;
  srcset?: MaybeSignal<string | undefined>;
  srcDoc?: MaybeSignal<string | undefined>;
  srcLang?: MaybeSignal<string | undefined>;
  srcSet?: MaybeSignal<string | undefined>;
  start?: MaybeSignal<number | undefined>;
  step?: MaybeSignal<number | string | undefined>;
  summary?: MaybeSignal<string | undefined>;
  tabIndex?: MaybeSignal<number | undefined>;
  target?: MaybeSignal<string | undefined>;
  title?: MaybeSignal<string | undefined>;
  type?: MaybeSignal<string | undefined>;
  useMap?: MaybeSignal<string | undefined>;
  value?: MaybeSignal<string | string[] | number | undefined>;
  volume?: MaybeSignal<string | number | undefined>;
  width?: MaybeSignal<number | string | undefined>;
  wmode?: MaybeSignal<string | undefined>;
  wrap?: MaybeSignal<string | undefined>;

  // Non-standard Attributes
  autocapitalize?: MaybeSignal<
    "off" | "none" | "on" | "sentences" | "words" | "characters" | undefined
  >;
  autoCapitalize?: MaybeSignal<
    "off" | "none" | "on" | "sentences" | "words" | "characters" | undefined
  >;
  disablePictureInPicture?: MaybeSignal<boolean | undefined>;
  results?: MaybeSignal<number | undefined>;
  translate?: MaybeSignal<"yes" | "no" | undefined>;

  // RDFa Attributes
  about?: MaybeSignal<string | undefined>;
  datatype?: MaybeSignal<string | undefined>;
  inlist?: MaybeSignal<any | undefined>;
  prefix?: MaybeSignal<string | undefined>;
  property?: MaybeSignal<string | undefined>;
  resource?: MaybeSignal<string | undefined>;
  typeof?: MaybeSignal<string | undefined>;
  vocab?: MaybeSignal<string | undefined>;

  // Microdata Attributes
  itemProp?: MaybeSignal<string | undefined>;
  itemScope?: MaybeSignal<boolean | undefined>;
  itemType?: MaybeSignal<string | undefined>;
  itemID?: MaybeSignal<string | undefined>;
  itemRef?: MaybeSignal<string | undefined>;

  [name: string]: any;
}

interface SvgProps<in E> extends HtmlProps<E> {
  accentHeight?: MaybeSignal<number | string | undefined>;
  accumulate?: MaybeSignal<"none" | "sum" | undefined>;
  additive?: MaybeSignal<"replace" | "sum" | undefined>;
  alignmentBaseline?: MaybeSignal<
    | "auto"
    | "baseline"
    | "before-edge"
    | "text-before-edge"
    | "middle"
    | "central"
    | "after-edge"
    | "text-after-edge"
    | "ideographic"
    | "alphabetic"
    | "hanging"
    | "mathematical"
    | "inherit"
    | undefined
  >;
  allowReorder?: MaybeSignal<"no" | "yes" | undefined>;
  alphabetic?: MaybeSignal<number | string | undefined>;
  amplitude?: MaybeSignal<number | string | undefined>;
  arabicForm?: MaybeSignal<
    "initial" | "medial" | "terminal" | "isolated" | undefined
  >;
  ascent?: MaybeSignal<number | string | undefined>;
  attributeName?: MaybeSignal<string | undefined>;
  attributeType?: MaybeSignal<string | undefined>;
  autoReverse?: MaybeSignal<number | string | undefined>;
  azimuth?: MaybeSignal<number | string | undefined>;
  baseFrequency?: MaybeSignal<number | string | undefined>;
  baselineShift?: MaybeSignal<number | string | undefined>;
  baseProfile?: MaybeSignal<number | string | undefined>;
  bbox?: MaybeSignal<number | string | undefined>;
  begin?: MaybeSignal<number | string | undefined>;
  bias?: MaybeSignal<number | string | undefined>;
  by?: MaybeSignal<number | string | undefined>;
  calcMode?: MaybeSignal<number | string | undefined>;
  capHeight?: MaybeSignal<number | string | undefined>;
  clip?: MaybeSignal<number | string | undefined>;
  clipPath?: MaybeSignal<string | undefined>;
  clipPathUnits?: MaybeSignal<number | string | undefined>;
  clipRule?: MaybeSignal<number | string | undefined>;
  colorInterpolation?: MaybeSignal<number | string | undefined>;
  colorInterpolationFilters?: MaybeSignal<
    "auto" | "sRGB" | "linearRGB" | "inherit" | undefined
  >;
  colorProfile?: MaybeSignal<number | string | undefined>;
  colorRendering?: MaybeSignal<number | string | undefined>;
  contentScriptType?: MaybeSignal<number | string | undefined>;
  contentStyleType?: MaybeSignal<number | string | undefined>;
  cursor?: MaybeSignal<number | string | undefined>;
  cx?: MaybeSignal<number | string | undefined>;
  cy?: MaybeSignal<number | string | undefined>;
  d?: MaybeSignal<string | undefined>;
  decelerate?: MaybeSignal<number | string | undefined>;
  descent?: MaybeSignal<number | string | undefined>;
  diffuseConstant?: MaybeSignal<number | string | undefined>;
  direction?: MaybeSignal<number | string | undefined>;
  display?: MaybeSignal<number | string | undefined>;
  divisor?: MaybeSignal<number | string | undefined>;
  dominantBaseline?: MaybeSignal<number | string | undefined>;
  dur?: MaybeSignal<number | string | undefined>;
  dx?: MaybeSignal<number | string | undefined>;
  dy?: MaybeSignal<number | string | undefined>;
  edgeMode?: MaybeSignal<number | string | undefined>;
  elevation?: MaybeSignal<number | string | undefined>;
  enableBackground?: MaybeSignal<number | string | undefined>;
  end?: MaybeSignal<number | string | undefined>;
  exponent?: MaybeSignal<number | string | undefined>;
  externalResourcesRequired?: MaybeSignal<number | string | undefined>;
  fill?: MaybeSignal<string | undefined>;
  fillOpacity?: MaybeSignal<number | string | undefined>;
  fillRule?: MaybeSignal<"nonzero" | "evenodd" | "inherit" | undefined>;
  filter?: MaybeSignal<string | undefined>;
  filterRes?: MaybeSignal<number | string | undefined>;
  filterUnits?: MaybeSignal<number | string | undefined>;
  floodColor?: MaybeSignal<number | string | undefined>;
  floodOpacity?: MaybeSignal<number | string | undefined>;
  focusable?: MaybeSignal<number | string | undefined>;
  fontFamily?: MaybeSignal<string | undefined>;
  fontSize?: MaybeSignal<number | string | undefined>;
  fontSizeAdjust?: MaybeSignal<number | string | undefined>;
  fontStretch?: MaybeSignal<number | string | undefined>;
  fontStyle?: MaybeSignal<number | string | undefined>;
  fontVariant?: MaybeSignal<number | string | undefined>;
  fontWeight?: MaybeSignal<number | string | undefined>;
  format?: MaybeSignal<number | string | undefined>;
  from?: MaybeSignal<number | string | undefined>;
  fx?: MaybeSignal<number | string | undefined>;
  fy?: MaybeSignal<number | string | undefined>;
  g1?: MaybeSignal<number | string | undefined>;
  g2?: MaybeSignal<number | string | undefined>;
  glyphName?: MaybeSignal<number | string | undefined>;
  glyphOrientationHorizontal?: MaybeSignal<number | string | undefined>;
  glyphOrientationVertical?: MaybeSignal<number | string | undefined>;
  glyphRef?: MaybeSignal<number | string | undefined>;
  gradientTransform?: MaybeSignal<string | undefined>;
  gradientUnits?: MaybeSignal<string | undefined>;
  hanging?: MaybeSignal<number | string | undefined>;
  horizAdvX?: MaybeSignal<number | string | undefined>;
  horizOriginX?: MaybeSignal<number | string | undefined>;
  ideographic?: MaybeSignal<number | string | undefined>;
  imageRendering?: MaybeSignal<number | string | undefined>;
  in2?: MaybeSignal<number | string | undefined>;
  in?: MaybeSignal<string | undefined>;
  intercept?: MaybeSignal<number | string | undefined>;
  k1?: MaybeSignal<number | string | undefined>;
  k2?: MaybeSignal<number | string | undefined>;
  k3?: MaybeSignal<number | string | undefined>;
  k4?: MaybeSignal<number | string | undefined>;
  k?: MaybeSignal<number | string | undefined>;
  kernelMatrix?: MaybeSignal<number | string | undefined>;
  kernelUnitLength?: MaybeSignal<number | string | undefined>;
  kerning?: MaybeSignal<number | string | undefined>;
  keyPoints?: MaybeSignal<number | string | undefined>;
  keySplines?: MaybeSignal<number | string | undefined>;
  keyTimes?: MaybeSignal<number | string | undefined>;
  lengthAdjust?: MaybeSignal<number | string | undefined>;
  letterSpacing?: MaybeSignal<number | string | undefined>;
  lightingColor?: MaybeSignal<number | string | undefined>;
  limitingConeAngle?: MaybeSignal<number | string | undefined>;
  local?: MaybeSignal<number | string | undefined>;
  markerEnd?: MaybeSignal<string | undefined>;
  markerHeight?: MaybeSignal<number | string | undefined>;
  markerMid?: MaybeSignal<string | undefined>;
  markerStart?: MaybeSignal<string | undefined>;
  markerUnits?: MaybeSignal<number | string | undefined>;
  markerWidth?: MaybeSignal<number | string | undefined>;
  mask?: MaybeSignal<string | undefined>;
  maskContentUnits?: MaybeSignal<number | string | undefined>;
  maskUnits?: MaybeSignal<number | string | undefined>;
  mathematical?: MaybeSignal<number | string | undefined>;
  mode?: MaybeSignal<number | string | undefined>;
  numOctaves?: MaybeSignal<number | string | undefined>;
  offset?: MaybeSignal<number | string | undefined>;
  opacity?: MaybeSignal<number | string | undefined>;
  operator?: MaybeSignal<number | string | undefined>;
  order?: MaybeSignal<number | string | undefined>;
  orient?: MaybeSignal<number | string | undefined>;
  orientation?: MaybeSignal<number | string | undefined>;
  origin?: MaybeSignal<number | string | undefined>;
  overflow?: MaybeSignal<number | string | undefined>;
  overlinePosition?: MaybeSignal<number | string | undefined>;
  overlineThickness?: MaybeSignal<number | string | undefined>;
  paintOrder?: MaybeSignal<number | string | undefined>;
  panose1?: MaybeSignal<number | string | undefined>;
  pathLength?: MaybeSignal<number | string | undefined>;
  patternContentUnits?: MaybeSignal<string | undefined>;
  patternTransform?: MaybeSignal<number | string | undefined>;
  patternUnits?: MaybeSignal<string | undefined>;
  pointerEvents?: MaybeSignal<number | string | undefined>;
  points?: MaybeSignal<string | undefined>;
  pointsAtX?: MaybeSignal<number | string | undefined>;
  pointsAtY?: MaybeSignal<number | string | undefined>;
  pointsAtZ?: MaybeSignal<number | string | undefined>;
  preserveAlpha?: MaybeSignal<number | string | undefined>;
  preserveAspectRatio?: MaybeSignal<string | undefined>;
  primitiveUnits?: MaybeSignal<number | string | undefined>;
  r?: MaybeSignal<number | string | undefined>;
  radius?: MaybeSignal<number | string | undefined>;
  refX?: MaybeSignal<number | string | undefined>;
  refY?: MaybeSignal<number | string | undefined>;
  renderingIntent?: MaybeSignal<number | string | undefined>;
  repeatCount?: MaybeSignal<number | string | undefined>;
  repeatDur?: MaybeSignal<number | string | undefined>;
  requiredExtensions?: MaybeSignal<number | string | undefined>;
  requiredFeatures?: MaybeSignal<number | string | undefined>;
  restart?: MaybeSignal<number | string | undefined>;
  result?: MaybeSignal<string | undefined>;
  rotate?: MaybeSignal<number | string | undefined>;
  rx?: MaybeSignal<number | string | undefined>;
  ry?: MaybeSignal<number | string | undefined>;
  scale?: MaybeSignal<number | string | undefined>;
  seed?: MaybeSignal<number | string | undefined>;
  shapeRendering?: MaybeSignal<number | string | undefined>;
  slope?: MaybeSignal<number | string | undefined>;
  spacing?: MaybeSignal<number | string | undefined>;
  specularConstant?: MaybeSignal<number | string | undefined>;
  specularExponent?: MaybeSignal<number | string | undefined>;
  speed?: MaybeSignal<number | string | undefined>;
  spreadMethod?: MaybeSignal<string | undefined>;
  startOffset?: MaybeSignal<number | string | undefined>;
  stdDeviation?: MaybeSignal<number | string | undefined>;
  stemh?: MaybeSignal<number | string | undefined>;
  stemv?: MaybeSignal<number | string | undefined>;
  stitchTiles?: MaybeSignal<number | string | undefined>;
  stopColor?: MaybeSignal<string | undefined>;
  stopOpacity?: MaybeSignal<number | string | undefined>;
  strikethroughPosition?: MaybeSignal<number | string | undefined>;
  strikethroughThickness?: MaybeSignal<number | string | undefined>;
  string?: MaybeSignal<number | string | undefined>;
  stroke?: MaybeSignal<string | undefined>;
  strokeDasharray?: MaybeSignal<number | string | undefined>;
  strokeDashoffset?: MaybeSignal<number | string | undefined>;
  strokeLinecap?: MaybeSignal<
    "butt" | "round" | "square" | "inherit" | undefined
  >;
  strokeLinejoin?: MaybeSignal<
    "miter" | "round" | "bevel" | "inherit" | undefined
  >;
  strokeMiterlimit?: MaybeSignal<number | string | undefined>;
  strokeOpacity?: MaybeSignal<number | string | undefined>;
  strokeWidth?: MaybeSignal<number | string | undefined>;
  surfaceScale?: MaybeSignal<number | string | undefined>;
  systemLanguage?: MaybeSignal<number | string | undefined>;
  tableValues?: MaybeSignal<number | string | undefined>;
  targetX?: MaybeSignal<number | string | undefined>;
  targetY?: MaybeSignal<number | string | undefined>;
  textAnchor?: MaybeSignal<string | undefined>;
  textDecoration?: MaybeSignal<number | string | undefined>;
  textLength?: MaybeSignal<number | string | undefined>;
  textRendering?: MaybeSignal<number | string | undefined>;
  to?: MaybeSignal<number | string | undefined>;
  transform?: MaybeSignal<string | undefined>;
  u1?: MaybeSignal<number | string | undefined>;
  u2?: MaybeSignal<number | string | undefined>;
  underlinePosition?: MaybeSignal<number | string | undefined>;
  underlineThickness?: MaybeSignal<number | string | undefined>;
  unicode?: MaybeSignal<number | string | undefined>;
  unicodeBidi?: MaybeSignal<number | string | undefined>;
  unicodeRange?: MaybeSignal<number | string | undefined>;
  unitsPerEm?: MaybeSignal<number | string | undefined>;
  vAlphabetic?: MaybeSignal<number | string | undefined>;
  values?: MaybeSignal<string | undefined>;
  vectorEffect?: MaybeSignal<number | string | undefined>;
  version?: MaybeSignal<string | undefined>;
  vertAdvY?: MaybeSignal<number | string | undefined>;
  vertOriginX?: MaybeSignal<number | string | undefined>;
  vertOriginY?: MaybeSignal<number | string | undefined>;
  vHanging?: MaybeSignal<number | string | undefined>;
  vIdeographic?: MaybeSignal<number | string | undefined>;
  viewBox?: MaybeSignal<string | undefined>;
  viewTarget?: MaybeSignal<number | string | undefined>;
  visibility?: MaybeSignal<number | string | undefined>;
  vMathematical?: MaybeSignal<number | string | undefined>;
  widths?: MaybeSignal<number | string | undefined>;
  wordSpacing?: MaybeSignal<number | string | undefined>;
  writingMode?: MaybeSignal<number | string | undefined>;
  x1?: MaybeSignal<number | string | undefined>;
  x2?: MaybeSignal<number | string | undefined>;
  x?: MaybeSignal<number | string | undefined>;
  xChannelSelector?: MaybeSignal<string | undefined>;
  xHeight?: MaybeSignal<number | string | undefined>;
  xlinkActuate?: MaybeSignal<string | undefined>;
  xlinkArcrole?: MaybeSignal<string | undefined>;
  xlinkHref?: MaybeSignal<string | undefined>;
  xlinkRole?: MaybeSignal<string | undefined>;
  xlinkShow?: MaybeSignal<string | undefined>;
  xlinkTitle?: MaybeSignal<string | undefined>;
  xlinkType?: MaybeSignal<string | undefined>;
  xmlBase?: MaybeSignal<string | undefined>;
  xmlLang?: MaybeSignal<string | undefined>;
  xmlns?: MaybeSignal<string | undefined>;
  xmlnsXlink?: MaybeSignal<string | undefined>;
  xmlSpace?: MaybeSignal<string | undefined>;
  y1?: MaybeSignal<number | string | undefined>;
  y2?: MaybeSignal<number | string | undefined>;
  y?: MaybeSignal<number | string | undefined>;
  yChannelSelector?: MaybeSignal<string | undefined>;
  z?: MaybeSignal<number | string | undefined>;
  zoomAndPan?: MaybeSignal<string | undefined>;
}
