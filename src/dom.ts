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

import type { Children, MaybeSignal, RefSignalSetter, SignalLike } from "./mod.js";

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

export const setAttr = (node: any, name: string, value: unknown): void => {
  const removeAttribute =
    value == null || (value === false && !name.includes("-"));

  if (name.startsWith("prop:")) {
    node[name] = value;
  } else if (name.startsWith("attr:")) {
    if (!removeAttribute) {
      node.setAttribute(name, value);
    } else {
      node.removeAttribute(name);
    }
  } else if (name != "innerHTML") {
    if (
      ![
        "width",
        "height",
        "href",
        "list",
        "form",
        // Default value in browsers is `-1` and an empty string is
        // cast to `0` instead
        "tabIndex",
        "download",
        "rowSpan",
        "colSpan",
        "role",
      ].includes(name) &&
      name in node
    ) {
      try {
        node[name] = value == null ? "" : value;
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
  a: HtmlProps<HTMLAnchorElement> & EventProps<HTMLAnchorElement>;
  abbr: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  address: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  area: HtmlProps<HTMLAreaElement> & EventProps<HTMLAreaElement>;
  article: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  aside: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  audio: HtmlProps<HTMLAudioElement> & EventProps<HTMLAudioElement>;
  b: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  base: HtmlProps<HTMLBaseElement> & EventProps<HTMLBaseElement>;
  bdi: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  bdo: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  big: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  blockquote: HtmlProps<HTMLQuoteElement> & EventProps<HTMLQuoteElement>;
  body: HtmlProps<HTMLBodyElement> & EventProps<HTMLBodyElement>;
  br: HtmlProps<HTMLBRElement> & EventProps<HTMLBRElement>;
  button: HtmlProps<HTMLButtonElement> & EventProps<HTMLButtonElement>;
  canvas: HtmlProps<HTMLCanvasElement> & EventProps<HTMLCanvasElement>;
  caption: HtmlProps<HTMLTableCaptionElement> &
    EventProps<HTMLTableCaptionElement>;
  cite: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  code: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  col: HtmlProps<HTMLTableColElement> & EventProps<HTMLTableColElement>;
  colgroup: HtmlProps<HTMLTableColElement> & EventProps<HTMLTableColElement>;
  data: HtmlProps<HTMLDataElement> & EventProps<HTMLDataElement>;
  datalist: HtmlProps<HTMLDataListElement> & EventProps<HTMLDataListElement>;
  dd: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  del: HtmlProps<HTMLModElement> & EventProps<HTMLModElement>;
  details: HtmlProps<HTMLDetailsElement> & EventProps<HTMLDetailsElement>;
  dfn: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  dialog: HtmlProps<HTMLDialogElement> & EventProps<HTMLDialogElement>;
  div: HtmlProps<HTMLDivElement> & EventProps<HTMLDivElement>;
  dl: HtmlProps<HTMLDListElement> & EventProps<HTMLDListElement>;
  dt: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  em: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  embed: HtmlProps<HTMLEmbedElement> & EventProps<HTMLEmbedElement>;
  fieldset: HtmlProps<HTMLFieldSetElement> & EventProps<HTMLFieldSetElement>;
  figcaption: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  figure: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  footer: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  form: HtmlProps<HTMLFormElement> & EventProps<HTMLFormElement>;
  h1: HtmlProps<HTMLHeadingElement> & EventProps<HTMLHeadingElement>;
  h2: HtmlProps<HTMLHeadingElement> & EventProps<HTMLHeadingElement>;
  h3: HtmlProps<HTMLHeadingElement> & EventProps<HTMLHeadingElement>;
  h4: HtmlProps<HTMLHeadingElement> & EventProps<HTMLHeadingElement>;
  h5: HtmlProps<HTMLHeadingElement> & EventProps<HTMLHeadingElement>;
  h6: HtmlProps<HTMLHeadingElement> & EventProps<HTMLHeadingElement>;
  head: HtmlProps<HTMLHeadElement> & EventProps<HTMLHeadElement>;
  header: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  hgroup: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  hr: HtmlProps<HTMLHRElement> & EventProps<HTMLHRElement>;
  html: HtmlProps<HTMLHtmlElement> & EventProps<HTMLHtmlElement>;
  i: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  iframe: HtmlProps<HTMLIFrameElement> & EventProps<HTMLIFrameElement>;
  img: HtmlProps<HTMLImageElement> & EventProps<HTMLImageElement>;
  input: HtmlProps<HTMLInputElement> & EventProps<HTMLInputElement>;
  ins: HtmlProps<HTMLModElement> & EventProps<HTMLModElement>;
  kbd: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  keygen: HtmlProps<HTMLUnknownElement> & EventProps<HTMLUnknownElement>;
  label: HtmlProps<HTMLLabelElement> & EventProps<HTMLLabelElement>;
  legend: HtmlProps<HTMLLegendElement> & EventProps<HTMLLegendElement>;
  li: HtmlProps<HTMLLIElement> & EventProps<HTMLLIElement>;
  link: HtmlProps<HTMLLinkElement> & EventProps<HTMLLinkElement>;
  main: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  map: HtmlProps<HTMLMapElement> & EventProps<HTMLMapElement>;
  mark: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  marquee: HtmlProps<HTMLMarqueeElement> & EventProps<HTMLMarqueeElement>;
  menu: HtmlProps<HTMLMenuElement> & EventProps<HTMLMenuElement>;
  menuitem: HtmlProps<HTMLUnknownElement> & EventProps<HTMLUnknownElement>;
  meta: HtmlProps<HTMLMetaElement> & EventProps<HTMLMetaElement>;
  meter: HtmlProps<HTMLMeterElement> & EventProps<HTMLMeterElement>;
  nav: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  noscript: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  object: HtmlProps<HTMLObjectElement> & EventProps<HTMLObjectElement>;
  ol: HtmlProps<HTMLOListElement> & EventProps<HTMLOListElement>;
  optgroup: HtmlProps<HTMLOptGroupElement> & EventProps<HTMLOptGroupElement>;
  option: HtmlProps<HTMLOptionElement> & EventProps<HTMLOptionElement>;
  output: HtmlProps<HTMLOutputElement> & EventProps<HTMLOutputElement>;
  p: HtmlProps<HTMLParagraphElement> & EventProps<HTMLParagraphElement>;
  param: HtmlProps<HTMLParamElement> & EventProps<HTMLParamElement>;
  picture: HtmlProps<HTMLPictureElement> & EventProps<HTMLPictureElement>;
  pre: HtmlProps<HTMLPreElement> & EventProps<HTMLPreElement>;
  progress: HtmlProps<HTMLProgressElement> & EventProps<HTMLProgressElement>;
  q: HtmlProps<HTMLQuoteElement> & EventProps<HTMLQuoteElement>;
  rp: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  rt: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  ruby: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  s: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  samp: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  script: HtmlProps<HTMLScriptElement> & EventProps<HTMLScriptElement>;
  section: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  select: HtmlProps<HTMLSelectElement> & EventProps<HTMLSelectElement>;
  slot: HtmlProps<HTMLSlotElement> & EventProps<HTMLSlotElement>;
  small: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  source: HtmlProps<HTMLSourceElement> & EventProps<HTMLSourceElement>;
  span: HtmlProps<HTMLSpanElement> & EventProps<HTMLSpanElement>;
  strong: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  style: HtmlProps<HTMLStyleElement> & EventProps<HTMLStyleElement>;
  sub: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  summary: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  sup: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  table: HtmlProps<HTMLTableElement> & EventProps<HTMLTableElement>;
  tbody: HtmlProps<HTMLTableSectionElement> &
    EventProps<HTMLTableSectionElement>;
  td: HtmlProps<HTMLTableCellElement> & EventProps<HTMLTableCellElement>;
  textarea: HtmlProps<HTMLTextAreaElement> & EventProps<HTMLTextAreaElement>;
  tfoot: HtmlProps<HTMLTableSectionElement> &
    EventProps<HTMLTableSectionElement>;
  th: HtmlProps<HTMLTableCellElement> & EventProps<HTMLTableCellElement>;
  thead: HtmlProps<HTMLTableSectionElement> &
    EventProps<HTMLTableSectionElement>;
  time: HtmlProps<HTMLTimeElement> & EventProps<HTMLTimeElement>;
  title: HtmlProps<HTMLTitleElement> & EventProps<HTMLTitleElement>;
  tr: HtmlProps<HTMLTableRowElement> & EventProps<HTMLTableRowElement>;
  track: HtmlProps<HTMLTrackElement> & EventProps<HTMLTrackElement>;
  u: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  ul: HtmlProps<HTMLUListElement> & EventProps<HTMLUListElement>;
  var: HtmlProps<HTMLElement> & EventProps<HTMLElement>;
  video: HtmlProps<HTMLVideoElement> & EventProps<HTMLVideoElement>;
  wbr: HtmlProps<HTMLElement> & EventProps<HTMLElement>;

  //SVG
  svg: SvgProps<SVGSVGElement> & EventProps<SVGSVGElement>;
  animate: SvgProps<SVGAnimateElement> & EventProps<SVGAnimateElement>;
  circle: SvgProps<SVGCircleElement> & EventProps<SVGCircleElement>;
  animateTransform: SvgProps<SVGAnimateElement> & EventProps<SVGAnimateElement>;
  clipPath: SvgProps<SVGClipPathElement> & EventProps<SVGClipPathElement>;
  defs: SvgProps<SVGDefsElement> & EventProps<SVGDefsElement>;
  desc: SvgProps<SVGDescElement> & EventProps<SVGDescElement>;
  ellipse: SvgProps<SVGEllipseElement> & EventProps<SVGEllipseElement>;
  feBlend: SvgProps<SVGFEBlendElement> & EventProps<SVGFEBlendElement>;
  feColorMatrix: SvgProps<SVGFEColorMatrixElement> &
    EventProps<SVGFEColorMatrixElement>;
  feComponentTransfer: SvgProps<SVGFEComponentTransferElement> &
    EventProps<SVGFEComponentTransferElement>;
  feComposite: SvgProps<SVGFECompositeElement> &
    EventProps<SVGFECompositeElement>;
  feConvolveMatrix: SvgProps<SVGFEConvolveMatrixElement> &
    EventProps<SVGFEConvolveMatrixElement>;
  feDiffuseLighting: SvgProps<SVGFEDiffuseLightingElement> &
    EventProps<SVGFEDiffuseLightingElement>;
  feDisplacementMap: SvgProps<SVGFEDisplacementMapElement> &
    EventProps<SVGFEDisplacementMapElement>;
  feDropShadow: SvgProps<SVGFEDropShadowElement> &
    EventProps<SVGFEDropShadowElement>;
  feFlood: SvgProps<SVGFEFloodElement> & EventProps<SVGFEFloodElement>;
  feFuncA: SvgProps<SVGFEFuncAElement> & EventProps<SVGFEFuncAElement>;
  feFuncB: SvgProps<SVGFEFuncBElement> & EventProps<SVGFEFuncBElement>;
  feFuncG: SvgProps<SVGFEFuncGElement> & EventProps<SVGFEFuncGElement>;
  feFuncR: SvgProps<SVGFEFuncRElement> & EventProps<SVGFEFuncRElement>;
  feGaussianBlur: SvgProps<SVGFEGaussianBlurElement> &
    EventProps<SVGFEGaussianBlurElement>;
  feImage: SvgProps<SVGFEImageElement> & EventProps<SVGFEImageElement>;
  feMerge: SvgProps<SVGFEMergeElement> & EventProps<SVGFEMergeElement>;
  feMergeNode: SvgProps<SVGFEMergeNodeElement> &
    EventProps<SVGFEMergeNodeElement>;
  feMorphology: SvgProps<SVGFEMorphologyElement> &
    EventProps<SVGFEMorphologyElement>;
  feOffset: SvgProps<SVGFEOffsetElement> & EventProps<SVGFEOffsetElement>;
  feSpecularLighting: SvgProps<SVGFESpecularLightingElement> &
    EventProps<SVGFESpecularLightingElement>;
  feTile: SvgProps<SVGFETileElement> & EventProps<SVGFETileElement>;
  feTurbulence: SvgProps<SVGFETurbulenceElement> &
    EventProps<SVGFETurbulenceElement>;
  filter: SvgProps<SVGFilterElement> & EventProps<SVGFilterElement>;
  foreignObject: SvgProps<SVGForeignObjectElement> &
    EventProps<SVGForeignObjectElement>;
  g: SvgProps<SVGGElement> & EventProps<SVGGElement>;
  image: SvgProps<SVGImageElement> & EventProps<SVGImageElement>;
  line: SvgProps<SVGLineElement> & EventProps<SVGLineElement>;
  linearGradient: SvgProps<SVGLinearGradientElement> &
    EventProps<SVGLinearGradientElement>;
  marker: SvgProps<SVGMarkerElement> & EventProps<SVGMarkerElement>;
  mask: SvgProps<SVGMaskElement> & EventProps<SVGMaskElement>;
  path: SvgProps<SVGPathElement> & EventProps<SVGPathElement>;
  pattern: SvgProps<SVGPatternElement> & EventProps<SVGPatternElement>;
  polygon: SvgProps<SVGPolygonElement> & EventProps<SVGPolygonElement>;
  polyline: SvgProps<SVGPolylineElement> & EventProps<SVGPolylineElement>;
  radialGradient: SvgProps<SVGRadialGradientElement> &
    EventProps<SVGRadialGradientElement>;
  rect: SvgProps<SVGRectElement> & EventProps<SVGRectElement>;
  stop: SvgProps<SVGStopElement> & EventProps<SVGStopElement>;
  symbol: SvgProps<SVGSymbolElement> & EventProps<SVGSymbolElement>;
  text: SvgProps<SVGTextElement> & EventProps<SVGTextElement>;
  textPath: SvgProps<SVGTextPathElement> & EventProps<SVGTextPathElement>;
  tspan: SvgProps<SVGTSpanElement> & EventProps<SVGTSpanElement>;
  use: SvgProps<SVGUseElement> & EventProps<SVGUseElement>;

  [tagName: string]: DomProps<any> & Record<string, any>;
}

export type Style = {
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

type EventMap = ElementEventMap &
  DocumentEventMap &
  GlobalEventHandlersEventMap;

export type EventHandler<K extends keyof EventMap, E> = (
  this: E,
  evt: Omit<EventMap[K], "currentTarget"> & {
    currentTarget: E;
  },
) => void;

type EventProps<E> = {
  [K in keyof EventMap as `on${K}`]?: EventHandler<K, E>;
};

export type DangerousHtml = SignalLike<{
  __html: string;
}>;

export interface DomProps<in E> {
  ref?: RefSignalSetter<E | undefined>;
  id?: MaybeSignal<string>;
  class?: MaybeSignal<string | undefined>;
  style?: Style;
  dangerouslySetInnerHTML?: DangerousHtml;
  children?: Children;
}

interface HtmlProps<in E> extends DomProps<E> {
  // Standard HTML Attributes
  accept?: MaybeSignal<string>;
  acceptCharset?: MaybeSignal<string>;
  accessKey?: MaybeSignal<string>;
  action?: MaybeSignal<string>;
  allow?: MaybeSignal<string>;
  allowFullScreen?: MaybeSignal<boolean>;
  allowTransparency?: MaybeSignal<boolean>;
  alt?: MaybeSignal<string>;
  as?: MaybeSignal<string>;
  async?: MaybeSignal<boolean>;
  autocomplete?: MaybeSignal<string>;
  autoComplete?: MaybeSignal<string>;
  autocorrect?: MaybeSignal<string>;
  autoCorrect?: MaybeSignal<string>;
  autofocus?: MaybeSignal<boolean>;
  autoFocus?: MaybeSignal<boolean>;
  autoPlay?: MaybeSignal<boolean>;
  capture?: MaybeSignal<string>;
  cellPadding?: MaybeSignal<string>;
  cellSpacing?: MaybeSignal<string>;
  charSet?: MaybeSignal<string>;
  challenge?: MaybeSignal<string>;
  checked?: MaybeSignal<boolean>;
  cite?: MaybeSignal<string>;
  cols?: MaybeSignal<number>;
  colSpan?: MaybeSignal<number>;
  content?: MaybeSignal<string>;
  contentEditable?: MaybeSignal<boolean>;
  contextMenu?: MaybeSignal<string>;
  controls?: MaybeSignal<boolean>;
  controlsList?: MaybeSignal<string>;
  coords?: MaybeSignal<string>;
  crossOrigin?: MaybeSignal<string>;
  data?: MaybeSignal<string>;
  dateTime?: MaybeSignal<string>;
  default?: MaybeSignal<boolean>;
  defer?: MaybeSignal<boolean>;
  dir?: MaybeSignal<"auto" | "rtl" | "ltr">;
  disabled?: MaybeSignal<boolean>;
  disableRemotePlayback?: MaybeSignal<boolean>;
  download?: MaybeSignal<any>;
  decoding?: MaybeSignal<"sync" | "async" | "auto">;
  draggable?: MaybeSignal<boolean>;
  encType?: MaybeSignal<string>;
  enterkeyhint?: MaybeSignal<
    "enter" | "done" | "go" | "next" | "previous" | "search" | "send"
  >;
  for?: MaybeSignal<string>;
  form?: MaybeSignal<string>;
  formAction?: MaybeSignal<string>;
  formEncType?: MaybeSignal<string>;
  formMethod?: MaybeSignal<string>;
  formNoValidate?: MaybeSignal<boolean>;
  formTarget?: MaybeSignal<string>;
  frameBorder?: MaybeSignal<number | string>;
  headers?: MaybeSignal<string>;
  height?: MaybeSignal<number | string>;
  hidden?: MaybeSignal<boolean>;
  high?: MaybeSignal<number>;
  href?: MaybeSignal<string>;
  hrefLang?: MaybeSignal<string>;
  httpEquiv?: MaybeSignal<string>;
  icon?: MaybeSignal<string>;
  inputMode?: MaybeSignal<string>;
  integrity?: MaybeSignal<string>;
  is?: MaybeSignal<string>;
  keyParams?: MaybeSignal<string>;
  keyType?: MaybeSignal<string>;
  kind?: MaybeSignal<string>;
  label?: MaybeSignal<string>;
  lang?: MaybeSignal<string>;
  list?: MaybeSignal<string>;
  loading?: MaybeSignal<"eager" | "lazy">;
  loop?: MaybeSignal<boolean>;
  low?: MaybeSignal<number>;
  manifest?: MaybeSignal<string>;
  marginHeight?: MaybeSignal<number>;
  marginWidth?: MaybeSignal<number>;
  max?: MaybeSignal<string>;
  maxLength?: MaybeSignal<number>;
  media?: MaybeSignal<string>;
  mediaGroup?: MaybeSignal<string>;
  method?: MaybeSignal<string>;
  min?: MaybeSignal<string>;
  minLength?: MaybeSignal<number>;
  multiple?: MaybeSignal<boolean>;
  muted?: MaybeSignal<boolean>;
  name?: MaybeSignal<string>;
  nomodule?: MaybeSignal<boolean>;
  nonce?: MaybeSignal<string>;
  noValidate?: MaybeSignal<boolean>;
  open?: MaybeSignal<boolean>;
  optimum?: MaybeSignal<number>;
  part?: MaybeSignal<string>;
  pattern?: MaybeSignal<string>;
  ping?: MaybeSignal<string>;
  placeholder?: MaybeSignal<string>;
  playsInline?: MaybeSignal<boolean>;
  poster?: MaybeSignal<string>;
  preload?: MaybeSignal<string>;
  radioGroup?: MaybeSignal<string>;
  readonly?: MaybeSignal<boolean>;
  readOnly?: MaybeSignal<boolean>;
  referrerpolicy?: MaybeSignal<
    | "no-referrer"
    | "no-referrer-when-downgrade"
    | "origin"
    | "origin-when-cross-origin"
    | "same-origin"
    | "strict-origin"
    | "strict-origin-when-cross-origin"
    | "unsafe-url"
  >;
  rel?: MaybeSignal<string>;
  required?: MaybeSignal<boolean>;
  reversed?: MaybeSignal<boolean>;
  role?: MaybeSignal<string>;
  rows?: MaybeSignal<number>;
  rowSpan?: MaybeSignal<number>;
  sandbox?: MaybeSignal<string>;
  scope?: MaybeSignal<string>;
  scoped?: MaybeSignal<boolean>;
  scrolling?: MaybeSignal<string>;
  seamless?: MaybeSignal<boolean>;
  selected?: MaybeSignal<boolean>;
  shape?: MaybeSignal<string>;
  size?: MaybeSignal<number>;
  sizes?: MaybeSignal<string>;
  slot?: MaybeSignal<string>;
  span?: MaybeSignal<number>;
  spellcheck?: MaybeSignal<boolean>;
  spellCheck?: MaybeSignal<boolean>;
  src?: MaybeSignal<string>;
  srcset?: MaybeSignal<string>;
  srcDoc?: MaybeSignal<string>;
  srcLang?: MaybeSignal<string>;
  srcSet?: MaybeSignal<string>;
  start?: MaybeSignal<number>;
  step?: MaybeSignal<number | string>;
  summary?: MaybeSignal<string>;
  tabIndex?: MaybeSignal<number>;
  target?: MaybeSignal<string>;
  title?: MaybeSignal<string>;
  type?: MaybeSignal<string>;
  useMap?: MaybeSignal<string>;
  value?: MaybeSignal<string | string[] | number>;
  volume?: MaybeSignal<string | number>;
  width?: MaybeSignal<number | string>;
  wmode?: MaybeSignal<string>;
  wrap?: MaybeSignal<string>;

  // Non-standard Attributes
  autocapitalize?: MaybeSignal<
    "off" | "none" | "on" | "sentences" | "words" | "characters"
  >;
  autoCapitalize?: MaybeSignal<
    "off" | "none" | "on" | "sentences" | "words" | "characters"
  >;
  disablePictureInPicture?: MaybeSignal<boolean>;
  results?: MaybeSignal<number>;
  translate?: MaybeSignal<"yes" | "no">;

  // RDFa Attributes
  about?: MaybeSignal<string>;
  datatype?: MaybeSignal<string>;
  inlist?: MaybeSignal<any>;
  prefix?: MaybeSignal<string>;
  property?: MaybeSignal<string>;
  resource?: MaybeSignal<string>;
  typeof?: MaybeSignal<string>;
  vocab?: MaybeSignal<string>;

  // Microdata Attributes
  itemProp?: MaybeSignal<string>;
  itemScope?: MaybeSignal<boolean>;
  itemType?: MaybeSignal<string>;
  itemID?: MaybeSignal<string>;
  itemRef?: MaybeSignal<string>;

  [name: string]: any;
}

interface SvgProps<in E> extends HtmlProps<E> {
  accentHeight?: MaybeSignal<number | string>;
  accumulate?: MaybeSignal<"none" | "sum">;
  additive?: MaybeSignal<"replace" | "sum">;
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
  >;
  allowReorder?: MaybeSignal<"no" | "yes">;
  alphabetic?: MaybeSignal<number | string>;
  amplitude?: MaybeSignal<number | string>;
  arabicForm?: MaybeSignal<"initial" | "medial" | "terminal" | "isolated">;
  ascent?: MaybeSignal<number | string>;
  attributeName?: MaybeSignal<string>;
  attributeType?: MaybeSignal<string>;
  autoReverse?: MaybeSignal<number | string>;
  azimuth?: MaybeSignal<number | string>;
  baseFrequency?: MaybeSignal<number | string>;
  baselineShift?: MaybeSignal<number | string>;
  baseProfile?: MaybeSignal<number | string>;
  bbox?: MaybeSignal<number | string>;
  begin?: MaybeSignal<number | string>;
  bias?: MaybeSignal<number | string>;
  by?: MaybeSignal<number | string>;
  calcMode?: MaybeSignal<number | string>;
  capHeight?: MaybeSignal<number | string>;
  clip?: MaybeSignal<number | string>;
  clipPath?: MaybeSignal<string>;
  clipPathUnits?: MaybeSignal<number | string>;
  clipRule?: MaybeSignal<number | string>;
  colorInterpolation?: MaybeSignal<number | string>;
  colorInterpolationFilters?: MaybeSignal<
    "auto" | "sRGB" | "linearRGB" | "inherit"
  >;
  colorProfile?: MaybeSignal<number | string>;
  colorRendering?: MaybeSignal<number | string>;
  contentScriptType?: MaybeSignal<number | string>;
  contentStyleType?: MaybeSignal<number | string>;
  cursor?: MaybeSignal<number | string>;
  cx?: MaybeSignal<number | string>;
  cy?: MaybeSignal<number | string>;
  d?: MaybeSignal<string>;
  decelerate?: MaybeSignal<number | string>;
  descent?: MaybeSignal<number | string>;
  diffuseConstant?: MaybeSignal<number | string>;
  direction?: MaybeSignal<number | string>;
  display?: MaybeSignal<number | string>;
  divisor?: MaybeSignal<number | string>;
  dominantBaseline?: MaybeSignal<number | string>;
  dur?: MaybeSignal<number | string>;
  dx?: MaybeSignal<number | string>;
  dy?: MaybeSignal<number | string>;
  edgeMode?: MaybeSignal<number | string>;
  elevation?: MaybeSignal<number | string>;
  enableBackground?: MaybeSignal<number | string>;
  end?: MaybeSignal<number | string>;
  exponent?: MaybeSignal<number | string>;
  externalResourcesRequired?: MaybeSignal<number | string>;
  fill?: MaybeSignal<string>;
  fillOpacity?: MaybeSignal<number | string>;
  fillRule?: MaybeSignal<"nonzero" | "evenodd" | "inherit">;
  filter?: MaybeSignal<string>;
  filterRes?: MaybeSignal<number | string>;
  filterUnits?: MaybeSignal<number | string>;
  floodColor?: MaybeSignal<number | string>;
  floodOpacity?: MaybeSignal<number | string>;
  focusable?: MaybeSignal<number | string>;
  fontFamily?: MaybeSignal<string>;
  fontSize?: MaybeSignal<number | string>;
  fontSizeAdjust?: MaybeSignal<number | string>;
  fontStretch?: MaybeSignal<number | string>;
  fontStyle?: MaybeSignal<number | string>;
  fontVariant?: MaybeSignal<number | string>;
  fontWeight?: MaybeSignal<number | string>;
  format?: MaybeSignal<number | string>;
  from?: MaybeSignal<number | string>;
  fx?: MaybeSignal<number | string>;
  fy?: MaybeSignal<number | string>;
  g1?: MaybeSignal<number | string>;
  g2?: MaybeSignal<number | string>;
  glyphName?: MaybeSignal<number | string>;
  glyphOrientationHorizontal?: MaybeSignal<number | string>;
  glyphOrientationVertical?: MaybeSignal<number | string>;
  glyphRef?: MaybeSignal<number | string>;
  gradientTransform?: MaybeSignal<string>;
  gradientUnits?: MaybeSignal<string>;
  hanging?: MaybeSignal<number | string>;
  horizAdvX?: MaybeSignal<number | string>;
  horizOriginX?: MaybeSignal<number | string>;
  ideographic?: MaybeSignal<number | string>;
  imageRendering?: MaybeSignal<number | string>;
  in2?: MaybeSignal<number | string>;
  in?: MaybeSignal<string>;
  intercept?: MaybeSignal<number | string>;
  k1?: MaybeSignal<number | string>;
  k2?: MaybeSignal<number | string>;
  k3?: MaybeSignal<number | string>;
  k4?: MaybeSignal<number | string>;
  k?: MaybeSignal<number | string>;
  kernelMatrix?: MaybeSignal<number | string>;
  kernelUnitLength?: MaybeSignal<number | string>;
  kerning?: MaybeSignal<number | string>;
  keyPoints?: MaybeSignal<number | string>;
  keySplines?: MaybeSignal<number | string>;
  keyTimes?: MaybeSignal<number | string>;
  lengthAdjust?: MaybeSignal<number | string>;
  letterSpacing?: MaybeSignal<number | string>;
  lightingColor?: MaybeSignal<number | string>;
  limitingConeAngle?: MaybeSignal<number | string>;
  local?: MaybeSignal<number | string>;
  markerEnd?: MaybeSignal<string>;
  markerHeight?: MaybeSignal<number | string>;
  markerMid?: MaybeSignal<string>;
  markerStart?: MaybeSignal<string>;
  markerUnits?: MaybeSignal<number | string>;
  markerWidth?: MaybeSignal<number | string>;
  mask?: MaybeSignal<string>;
  maskContentUnits?: MaybeSignal<number | string>;
  maskUnits?: MaybeSignal<number | string>;
  mathematical?: MaybeSignal<number | string>;
  mode?: MaybeSignal<number | string>;
  numOctaves?: MaybeSignal<number | string>;
  offset?: MaybeSignal<number | string>;
  opacity?: MaybeSignal<number | string>;
  operator?: MaybeSignal<number | string>;
  order?: MaybeSignal<number | string>;
  orient?: MaybeSignal<number | string>;
  orientation?: MaybeSignal<number | string>;
  origin?: MaybeSignal<number | string>;
  overflow?: MaybeSignal<number | string>;
  overlinePosition?: MaybeSignal<number | string>;
  overlineThickness?: MaybeSignal<number | string>;
  paintOrder?: MaybeSignal<number | string>;
  panose1?: MaybeSignal<number | string>;
  pathLength?: MaybeSignal<number | string>;
  patternContentUnits?: MaybeSignal<string>;
  patternTransform?: MaybeSignal<number | string>;
  patternUnits?: MaybeSignal<string>;
  pointerEvents?: MaybeSignal<number | string>;
  points?: MaybeSignal<string>;
  pointsAtX?: MaybeSignal<number | string>;
  pointsAtY?: MaybeSignal<number | string>;
  pointsAtZ?: MaybeSignal<number | string>;
  preserveAlpha?: MaybeSignal<number | string>;
  preserveAspectRatio?: MaybeSignal<string>;
  primitiveUnits?: MaybeSignal<number | string>;
  r?: MaybeSignal<number | string>;
  radius?: MaybeSignal<number | string>;
  refX?: MaybeSignal<number | string>;
  refY?: MaybeSignal<number | string>;
  renderingIntent?: MaybeSignal<number | string>;
  repeatCount?: MaybeSignal<number | string>;
  repeatDur?: MaybeSignal<number | string>;
  requiredExtensions?: MaybeSignal<number | string>;
  requiredFeatures?: MaybeSignal<number | string>;
  restart?: MaybeSignal<number | string>;
  result?: MaybeSignal<string>;
  rotate?: MaybeSignal<number | string>;
  rx?: MaybeSignal<number | string>;
  ry?: MaybeSignal<number | string>;
  scale?: MaybeSignal<number | string>;
  seed?: MaybeSignal<number | string>;
  shapeRendering?: MaybeSignal<number | string>;
  slope?: MaybeSignal<number | string>;
  spacing?: MaybeSignal<number | string>;
  specularConstant?: MaybeSignal<number | string>;
  specularExponent?: MaybeSignal<number | string>;
  speed?: MaybeSignal<number | string>;
  spreadMethod?: MaybeSignal<string>;
  startOffset?: MaybeSignal<number | string>;
  stdDeviation?: MaybeSignal<number | string>;
  stemh?: MaybeSignal<number | string>;
  stemv?: MaybeSignal<number | string>;
  stitchTiles?: MaybeSignal<number | string>;
  stopColor?: MaybeSignal<string>;
  stopOpacity?: MaybeSignal<number | string>;
  strikethroughPosition?: MaybeSignal<number | string>;
  strikethroughThickness?: MaybeSignal<number | string>;
  string?: MaybeSignal<number | string>;
  stroke?: MaybeSignal<string>;
  strokeDasharray?: MaybeSignal<number | string>;
  strokeDashoffset?: MaybeSignal<number | string>;
  strokeLinecap?: MaybeSignal<"butt" | "round" | "square" | "inherit">;
  strokeLinejoin?: MaybeSignal<"miter" | "round" | "bevel" | "inherit">;
  strokeMiterlimit?: MaybeSignal<number | string>;
  strokeOpacity?: MaybeSignal<number | string>;
  strokeWidth?: MaybeSignal<number | string>;
  surfaceScale?: MaybeSignal<number | string>;
  systemLanguage?: MaybeSignal<number | string>;
  tableValues?: MaybeSignal<number | string>;
  targetX?: MaybeSignal<number | string>;
  targetY?: MaybeSignal<number | string>;
  textAnchor?: MaybeSignal<string>;
  textDecoration?: MaybeSignal<number | string>;
  textLength?: MaybeSignal<number | string>;
  textRendering?: MaybeSignal<number | string>;
  to?: MaybeSignal<number | string>;
  transform?: MaybeSignal<string>;
  u1?: MaybeSignal<number | string>;
  u2?: MaybeSignal<number | string>;
  underlinePosition?: MaybeSignal<number | string>;
  underlineThickness?: MaybeSignal<number | string>;
  unicode?: MaybeSignal<number | string>;
  unicodeBidi?: MaybeSignal<number | string>;
  unicodeRange?: MaybeSignal<number | string>;
  unitsPerEm?: MaybeSignal<number | string>;
  vAlphabetic?: MaybeSignal<number | string>;
  values?: MaybeSignal<string>;
  vectorEffect?: MaybeSignal<number | string>;
  version?: MaybeSignal<string>;
  vertAdvY?: MaybeSignal<number | string>;
  vertOriginX?: MaybeSignal<number | string>;
  vertOriginY?: MaybeSignal<number | string>;
  vHanging?: MaybeSignal<number | string>;
  vIdeographic?: MaybeSignal<number | string>;
  viewBox?: MaybeSignal<string>;
  viewTarget?: MaybeSignal<number | string>;
  visibility?: MaybeSignal<number | string>;
  vMathematical?: MaybeSignal<number | string>;
  widths?: MaybeSignal<number | string>;
  wordSpacing?: MaybeSignal<number | string>;
  writingMode?: MaybeSignal<number | string>;
  x1?: MaybeSignal<number | string>;
  x2?: MaybeSignal<number | string>;
  x?: MaybeSignal<number | string>;
  xChannelSelector?: MaybeSignal<string>;
  xHeight?: MaybeSignal<number | string>;
  xlinkActuate?: MaybeSignal<string>;
  xlinkArcrole?: MaybeSignal<string>;
  xlinkHref?: MaybeSignal<string>;
  xlinkRole?: MaybeSignal<string>;
  xlinkShow?: MaybeSignal<string>;
  xlinkTitle?: MaybeSignal<string>;
  xlinkType?: MaybeSignal<string>;
  xmlBase?: MaybeSignal<string>;
  xmlLang?: MaybeSignal<string>;
  xmlns?: MaybeSignal<string>;
  xmlnsXlink?: MaybeSignal<string>;
  xmlSpace?: MaybeSignal<string>;
  y1?: MaybeSignal<number | string>;
  y2?: MaybeSignal<number | string>;
  y?: MaybeSignal<number | string>;
  yChannelSelector?: MaybeSignal<string>;
  z?: MaybeSignal<number | string>;
  zoomAndPan?: MaybeSignal<string>;
}
