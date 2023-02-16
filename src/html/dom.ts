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

import type { Signal, SignalLike } from "../scope.ts";
import type { Component } from "../renderer/mod.ts";
import type { DomRenderer } from "./mod.ts";

const IS_NON_DIMENSIONAL =
  /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;

export function setStyle(
  node: ElementCSSInlineStyle,
  key: any,
  value: string | number | null | undefined
): void {
  if (key[0] === "-") {
    node.style.setProperty(key, `${value}`);
  } else if (value == null) {
    node.style[key] = "";
  } else if (typeof value !== "number" || IS_NON_DIMENSIONAL.test(key)) {
    node.style[key] = `${value}`;
  } else {
    node.style[key] = `${value}px`;
  }
}

export function setAttr(node: any, name: string, value: unknown): void {
  if (name !== "innerHTML") {
    if (
      name !== "href" &&
      name !== "list" &&
      name !== "form" &&
      // Default value in browsers is `-1` and an empty string is
      // cast to `0` instead
      name !== "tabIndex" &&
      name !== "download" &&
      name in node
    ) {
      try {
        node[name] = value == null ? "" : value;
        return;
      } catch (e) {}
    }

    // ARIA-attributes have a different notion of boolean values.
    // The value `false` is different from the attribute not
    // existing on the DOM, so we can't remove it. For non-boolean
    // ARIA-attributes we could treat false as a removal, but the
    // amount of exceptions would cost us too many bytes. On top of
    // that other VDOM frameworks also always stringify `false`.

    if (typeof value === "function") {
      // never serialize functions as attribute values
    } else if (value != null && (value !== false || name.indexOf("-") != -1)) {
      node.setAttribute(name, value);
    } else {
      node.removeAttribute(name);
    }
  }
}

declare global {
  namespace JSX {
    interface Element extends Component<any, DomRenderer> {}

    interface ElementChildrenAttribute {
      children: {};
    }

    interface IntrinsicElements {
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
      colgroup: HtmlProps<HTMLTableColElement> &
        EventProps<HTMLTableColElement>;
      data: HtmlProps<HTMLDataElement> & EventProps<HTMLDataElement>;
      datalist: HtmlProps<HTMLDataListElement> &
        EventProps<HTMLDataListElement>;
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
      fieldset: HtmlProps<HTMLFieldSetElement> &
        EventProps<HTMLFieldSetElement>;
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
      optgroup: HtmlProps<HTMLOptGroupElement> &
        EventProps<HTMLOptGroupElement>;
      option: HtmlProps<HTMLOptionElement> & EventProps<HTMLOptionElement>;
      output: HtmlProps<HTMLOutputElement> & EventProps<HTMLOutputElement>;
      p: HtmlProps<HTMLParagraphElement> & EventProps<HTMLParagraphElement>;
      param: HtmlProps<HTMLParamElement> & EventProps<HTMLParamElement>;
      picture: HtmlProps<HTMLPictureElement> & EventProps<HTMLPictureElement>;
      pre: HtmlProps<HTMLPreElement> & EventProps<HTMLPreElement>;
      progress: HtmlProps<HTMLProgressElement> &
        EventProps<HTMLProgressElement>;
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
      textarea: HtmlProps<HTMLTextAreaElement> &
        EventProps<HTMLTextAreaElement>;
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
      animateTransform: SvgProps<SVGAnimateElement> &
        EventProps<SVGAnimateElement>;
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

      [tagName: string]: ShingoProps<globalThis.Element> & Record<string, any>;
    }
  }
}

type OptionalSignal<T> = T | SignalLike<T>;

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
  >]?: OptionalSignal<string | number | null | undefined>;
} & {
  [key: string]: OptionalSignal<string | number | null | undefined>;
};

type EventMap = ElementEventMap &
  DocumentAndElementEventHandlersEventMap &
  GlobalEventHandlersEventMap;

export type EventHandler<K extends keyof EventMap, E> = (
  this: E,
  evt: Omit<EventMap[K], "currentTarget"> & {
    currentTarget: E;
  }
) => void;

type EventProps<E> = {
  [K in keyof EventMap as `on${K}`]?: EventHandler<K, E>;
};

export type DangerousHtml = SignalLike<{
  __html: string;
}>;

interface ShingoProps<E> {
  ref?: Signal<E | null>;
  style?: Style;
  dangerouslySetInnerHTML?: DangerousHtml;
  children?:
    | OptionalSignal<string | number>
    | Component<any, DomRenderer>
    | (OptionalSignal<string | number> | Component<any, DomRenderer>)[];
}

interface HtmlProps<E> extends ShingoProps<E> {
  // Standard HTML Attributes
  accept?: OptionalSignal<string>;
  acceptCharset?: OptionalSignal<string>;
  accessKey?: OptionalSignal<string>;
  action?: OptionalSignal<string>;
  allow?: OptionalSignal<string>;
  allowFullScreen?: OptionalSignal<boolean>;
  allowTransparency?: OptionalSignal<boolean>;
  alt?: OptionalSignal<string>;
  as?: OptionalSignal<string>;
  async?: OptionalSignal<boolean>;
  autocomplete?: OptionalSignal<string>;
  autoComplete?: OptionalSignal<string>;
  autocorrect?: OptionalSignal<string>;
  autoCorrect?: OptionalSignal<string>;
  autofocus?: OptionalSignal<boolean>;
  autoFocus?: OptionalSignal<boolean>;
  autoPlay?: OptionalSignal<boolean>;
  capture?: OptionalSignal<string>;
  cellPadding?: OptionalSignal<string>;
  cellSpacing?: OptionalSignal<string>;
  charSet?: OptionalSignal<string>;
  challenge?: OptionalSignal<string>;
  checked?: OptionalSignal<boolean>;
  cite?: OptionalSignal<string>;
  class?: OptionalSignal<string | undefined>;
  className?: OptionalSignal<string | undefined>;
  cols?: OptionalSignal<number>;
  colSpan?: OptionalSignal<number>;
  content?: OptionalSignal<string>;
  contentEditable?: OptionalSignal<boolean>;
  contextMenu?: OptionalSignal<string>;
  controls?: OptionalSignal<boolean>;
  controlsList?: OptionalSignal<string>;
  coords?: OptionalSignal<string>;
  crossOrigin?: OptionalSignal<string>;
  data?: OptionalSignal<string>;
  dateTime?: OptionalSignal<string>;
  default?: OptionalSignal<boolean>;
  defer?: OptionalSignal<boolean>;
  dir?: OptionalSignal<"auto" | "rtl" | "ltr">;
  disabled?: OptionalSignal<boolean>;
  disableRemotePlayback?: OptionalSignal<boolean>;
  download?: OptionalSignal<any>;
  decoding?: OptionalSignal<"sync" | "async" | "auto">;
  draggable?: OptionalSignal<boolean>;
  encType?: OptionalSignal<string>;
  enterkeyhint?: OptionalSignal<
    "enter" | "done" | "go" | "next" | "previous" | "search" | "send"
  >;
  form?: OptionalSignal<string>;
  formAction?: OptionalSignal<string>;
  formEncType?: OptionalSignal<string>;
  formMethod?: OptionalSignal<string>;
  formNoValidate?: OptionalSignal<boolean>;
  formTarget?: OptionalSignal<string>;
  frameBorder?: OptionalSignal<number | string>;
  headers?: OptionalSignal<string>;
  height?: OptionalSignal<number | string>;
  hidden?: OptionalSignal<boolean>;
  high?: OptionalSignal<number>;
  href?: OptionalSignal<string>;
  hrefLang?: OptionalSignal<string>;
  for?: OptionalSignal<string>;
  httpEquiv?: OptionalSignal<string>;
  icon?: OptionalSignal<string>;
  id?: OptionalSignal<string>;
  inputMode?: OptionalSignal<string>;
  integrity?: OptionalSignal<string>;
  is?: OptionalSignal<string>;
  keyParams?: OptionalSignal<string>;
  keyType?: OptionalSignal<string>;
  kind?: OptionalSignal<string>;
  label?: OptionalSignal<string>;
  lang?: OptionalSignal<string>;
  list?: OptionalSignal<string>;
  loading?: OptionalSignal<"eager" | "lazy">;
  loop?: OptionalSignal<boolean>;
  low?: OptionalSignal<number>;
  manifest?: OptionalSignal<string>;
  marginHeight?: OptionalSignal<number>;
  marginWidth?: OptionalSignal<number>;
  max?: OptionalSignal<string>;
  maxLength?: OptionalSignal<number>;
  media?: OptionalSignal<string>;
  mediaGroup?: OptionalSignal<string>;
  method?: OptionalSignal<string>;
  min?: OptionalSignal<string>;
  minLength?: OptionalSignal<number>;
  multiple?: OptionalSignal<boolean>;
  muted?: OptionalSignal<boolean>;
  name?: OptionalSignal<string>;
  nomodule?: OptionalSignal<boolean>;
  nonce?: OptionalSignal<string>;
  noValidate?: OptionalSignal<boolean>;
  open?: OptionalSignal<boolean>;
  optimum?: OptionalSignal<number>;
  part?: OptionalSignal<string>;
  pattern?: OptionalSignal<string>;
  ping?: OptionalSignal<string>;
  placeholder?: OptionalSignal<string>;
  playsInline?: OptionalSignal<boolean>;
  poster?: OptionalSignal<string>;
  preload?: OptionalSignal<string>;
  radioGroup?: OptionalSignal<string>;
  readonly?: OptionalSignal<boolean>;
  readOnly?: OptionalSignal<boolean>;
  referrerpolicy?: OptionalSignal<
    | "no-referrer"
    | "no-referrer-when-downgrade"
    | "origin"
    | "origin-when-cross-origin"
    | "same-origin"
    | "strict-origin"
    | "strict-origin-when-cross-origin"
    | "unsafe-url"
  >;
  rel?: OptionalSignal<string>;
  required?: OptionalSignal<boolean>;
  reversed?: OptionalSignal<boolean>;
  role?: OptionalSignal<string>;
  rows?: OptionalSignal<number>;
  rowSpan?: OptionalSignal<number>;
  sandbox?: OptionalSignal<string>;
  scope?: OptionalSignal<string>;
  scoped?: OptionalSignal<boolean>;
  scrolling?: OptionalSignal<string>;
  seamless?: OptionalSignal<boolean>;
  selected?: OptionalSignal<boolean>;
  shape?: OptionalSignal<string>;
  size?: OptionalSignal<number>;
  sizes?: OptionalSignal<string>;
  slot?: OptionalSignal<string>;
  span?: OptionalSignal<number>;
  spellcheck?: OptionalSignal<boolean>;
  spellCheck?: OptionalSignal<boolean>;
  src?: OptionalSignal<string>;
  srcset?: OptionalSignal<string>;
  srcDoc?: OptionalSignal<string>;
  srcLang?: OptionalSignal<string>;
  srcSet?: OptionalSignal<string>;
  start?: OptionalSignal<number>;
  step?: OptionalSignal<number | string>;
  summary?: OptionalSignal<string>;
  tabIndex?: OptionalSignal<number>;
  target?: OptionalSignal<string>;
  title?: OptionalSignal<string>;
  type?: OptionalSignal<string>;
  useMap?: OptionalSignal<string>;
  value?: OptionalSignal<string | string[] | number>;
  volume?: OptionalSignal<string | number>;
  width?: OptionalSignal<number | string>;
  wmode?: OptionalSignal<string>;
  wrap?: OptionalSignal<string>;

  // Non-standard Attributes
  autocapitalize?: OptionalSignal<
    "off" | "none" | "on" | "sentences" | "words" | "characters"
  >;
  autoCapitalize?: OptionalSignal<
    "off" | "none" | "on" | "sentences" | "words" | "characters"
  >;
  disablePictureInPicture?: OptionalSignal<boolean>;
  results?: OptionalSignal<number>;
  translate?: OptionalSignal<"yes" | "no">;

  // RDFa Attributes
  about?: OptionalSignal<string>;
  datatype?: OptionalSignal<string>;
  inlist?: OptionalSignal<any>;
  prefix?: OptionalSignal<string>;
  property?: OptionalSignal<string>;
  resource?: OptionalSignal<string>;
  typeof?: OptionalSignal<string>;
  vocab?: OptionalSignal<string>;

  // Microdata Attributes
  itemProp?: OptionalSignal<string>;
  itemScope?: OptionalSignal<boolean>;
  itemType?: OptionalSignal<string>;
  itemID?: OptionalSignal<string>;
  itemRef?: OptionalSignal<string>;
}

interface SvgProps<E> extends HtmlProps<E> {
  accentHeight?: OptionalSignal<number | string>;
  accumulate?: OptionalSignal<"none" | "sum">;
  additive?: OptionalSignal<"replace" | "sum">;
  alignmentBaseline?: OptionalSignal<
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
  allowReorder?: OptionalSignal<"no" | "yes">;
  alphabetic?: OptionalSignal<number | string>;
  amplitude?: OptionalSignal<number | string>;
  arabicForm?: OptionalSignal<"initial" | "medial" | "terminal" | "isolated">;
  ascent?: OptionalSignal<number | string>;
  attributeName?: OptionalSignal<string>;
  attributeType?: OptionalSignal<string>;
  autoReverse?: OptionalSignal<number | string>;
  azimuth?: OptionalSignal<number | string>;
  baseFrequency?: OptionalSignal<number | string>;
  baselineShift?: OptionalSignal<number | string>;
  baseProfile?: OptionalSignal<number | string>;
  bbox?: OptionalSignal<number | string>;
  begin?: OptionalSignal<number | string>;
  bias?: OptionalSignal<number | string>;
  by?: OptionalSignal<number | string>;
  calcMode?: OptionalSignal<number | string>;
  capHeight?: OptionalSignal<number | string>;
  clip?: OptionalSignal<number | string>;
  clipPath?: OptionalSignal<string>;
  clipPathUnits?: OptionalSignal<number | string>;
  clipRule?: OptionalSignal<number | string>;
  colorInterpolation?: OptionalSignal<number | string>;
  colorInterpolationFilters?: OptionalSignal<
    "auto" | "sRGB" | "linearRGB" | "inherit"
  >;
  colorProfile?: OptionalSignal<number | string>;
  colorRendering?: OptionalSignal<number | string>;
  contentScriptType?: OptionalSignal<number | string>;
  contentStyleType?: OptionalSignal<number | string>;
  cursor?: OptionalSignal<number | string>;
  cx?: OptionalSignal<number | string>;
  cy?: OptionalSignal<number | string>;
  d?: OptionalSignal<string>;
  decelerate?: OptionalSignal<number | string>;
  descent?: OptionalSignal<number | string>;
  diffuseConstant?: OptionalSignal<number | string>;
  direction?: OptionalSignal<number | string>;
  display?: OptionalSignal<number | string>;
  divisor?: OptionalSignal<number | string>;
  dominantBaseline?: OptionalSignal<number | string>;
  dur?: OptionalSignal<number | string>;
  dx?: OptionalSignal<number | string>;
  dy?: OptionalSignal<number | string>;
  edgeMode?: OptionalSignal<number | string>;
  elevation?: OptionalSignal<number | string>;
  enableBackground?: OptionalSignal<number | string>;
  end?: OptionalSignal<number | string>;
  exponent?: OptionalSignal<number | string>;
  externalResourcesRequired?: OptionalSignal<number | string>;
  fill?: OptionalSignal<string>;
  fillOpacity?: OptionalSignal<number | string>;
  fillRule?: OptionalSignal<"nonzero" | "evenodd" | "inherit">;
  filter?: OptionalSignal<string>;
  filterRes?: OptionalSignal<number | string>;
  filterUnits?: OptionalSignal<number | string>;
  floodColor?: OptionalSignal<number | string>;
  floodOpacity?: OptionalSignal<number | string>;
  focusable?: OptionalSignal<number | string>;
  fontFamily?: OptionalSignal<string>;
  fontSize?: OptionalSignal<number | string>;
  fontSizeAdjust?: OptionalSignal<number | string>;
  fontStretch?: OptionalSignal<number | string>;
  fontStyle?: OptionalSignal<number | string>;
  fontVariant?: OptionalSignal<number | string>;
  fontWeight?: OptionalSignal<number | string>;
  format?: OptionalSignal<number | string>;
  from?: OptionalSignal<number | string>;
  fx?: OptionalSignal<number | string>;
  fy?: OptionalSignal<number | string>;
  g1?: OptionalSignal<number | string>;
  g2?: OptionalSignal<number | string>;
  glyphName?: OptionalSignal<number | string>;
  glyphOrientationHorizontal?: OptionalSignal<number | string>;
  glyphOrientationVertical?: OptionalSignal<number | string>;
  glyphRef?: OptionalSignal<number | string>;
  gradientTransform?: OptionalSignal<string>;
  gradientUnits?: OptionalSignal<string>;
  hanging?: OptionalSignal<number | string>;
  horizAdvX?: OptionalSignal<number | string>;
  horizOriginX?: OptionalSignal<number | string>;
  ideographic?: OptionalSignal<number | string>;
  imageRendering?: OptionalSignal<number | string>;
  in2?: OptionalSignal<number | string>;
  in?: OptionalSignal<string>;
  intercept?: OptionalSignal<number | string>;
  k1?: OptionalSignal<number | string>;
  k2?: OptionalSignal<number | string>;
  k3?: OptionalSignal<number | string>;
  k4?: OptionalSignal<number | string>;
  k?: OptionalSignal<number | string>;
  kernelMatrix?: OptionalSignal<number | string>;
  kernelUnitLength?: OptionalSignal<number | string>;
  kerning?: OptionalSignal<number | string>;
  keyPoints?: OptionalSignal<number | string>;
  keySplines?: OptionalSignal<number | string>;
  keyTimes?: OptionalSignal<number | string>;
  lengthAdjust?: OptionalSignal<number | string>;
  letterSpacing?: OptionalSignal<number | string>;
  lightingColor?: OptionalSignal<number | string>;
  limitingConeAngle?: OptionalSignal<number | string>;
  local?: OptionalSignal<number | string>;
  markerEnd?: OptionalSignal<string>;
  markerHeight?: OptionalSignal<number | string>;
  markerMid?: OptionalSignal<string>;
  markerStart?: OptionalSignal<string>;
  markerUnits?: OptionalSignal<number | string>;
  markerWidth?: OptionalSignal<number | string>;
  mask?: OptionalSignal<string>;
  maskContentUnits?: OptionalSignal<number | string>;
  maskUnits?: OptionalSignal<number | string>;
  mathematical?: OptionalSignal<number | string>;
  mode?: OptionalSignal<number | string>;
  numOctaves?: OptionalSignal<number | string>;
  offset?: OptionalSignal<number | string>;
  opacity?: OptionalSignal<number | string>;
  operator?: OptionalSignal<number | string>;
  order?: OptionalSignal<number | string>;
  orient?: OptionalSignal<number | string>;
  orientation?: OptionalSignal<number | string>;
  origin?: OptionalSignal<number | string>;
  overflow?: OptionalSignal<number | string>;
  overlinePosition?: OptionalSignal<number | string>;
  overlineThickness?: OptionalSignal<number | string>;
  paintOrder?: OptionalSignal<number | string>;
  panose1?: OptionalSignal<number | string>;
  pathLength?: OptionalSignal<number | string>;
  patternContentUnits?: OptionalSignal<string>;
  patternTransform?: OptionalSignal<number | string>;
  patternUnits?: OptionalSignal<string>;
  pointerEvents?: OptionalSignal<number | string>;
  points?: OptionalSignal<string>;
  pointsAtX?: OptionalSignal<number | string>;
  pointsAtY?: OptionalSignal<number | string>;
  pointsAtZ?: OptionalSignal<number | string>;
  preserveAlpha?: OptionalSignal<number | string>;
  preserveAspectRatio?: OptionalSignal<string>;
  primitiveUnits?: OptionalSignal<number | string>;
  r?: OptionalSignal<number | string>;
  radius?: OptionalSignal<number | string>;
  refX?: OptionalSignal<number | string>;
  refY?: OptionalSignal<number | string>;
  renderingIntent?: OptionalSignal<number | string>;
  repeatCount?: OptionalSignal<number | string>;
  repeatDur?: OptionalSignal<number | string>;
  requiredExtensions?: OptionalSignal<number | string>;
  requiredFeatures?: OptionalSignal<number | string>;
  restart?: OptionalSignal<number | string>;
  result?: OptionalSignal<string>;
  rotate?: OptionalSignal<number | string>;
  rx?: OptionalSignal<number | string>;
  ry?: OptionalSignal<number | string>;
  scale?: OptionalSignal<number | string>;
  seed?: OptionalSignal<number | string>;
  shapeRendering?: OptionalSignal<number | string>;
  slope?: OptionalSignal<number | string>;
  spacing?: OptionalSignal<number | string>;
  specularConstant?: OptionalSignal<number | string>;
  specularExponent?: OptionalSignal<number | string>;
  speed?: OptionalSignal<number | string>;
  spreadMethod?: OptionalSignal<string>;
  startOffset?: OptionalSignal<number | string>;
  stdDeviation?: OptionalSignal<number | string>;
  stemh?: OptionalSignal<number | string>;
  stemv?: OptionalSignal<number | string>;
  stitchTiles?: OptionalSignal<number | string>;
  stopColor?: OptionalSignal<string>;
  stopOpacity?: OptionalSignal<number | string>;
  strikethroughPosition?: OptionalSignal<number | string>;
  strikethroughThickness?: OptionalSignal<number | string>;
  string?: OptionalSignal<number | string>;
  stroke?: OptionalSignal<string>;
  strokeDasharray?: OptionalSignal<number | string>;
  strokeDashoffset?: OptionalSignal<number | string>;
  strokeLinecap?: OptionalSignal<"butt" | "round" | "square" | "inherit">;
  strokeLinejoin?: OptionalSignal<"miter" | "round" | "bevel" | "inherit">;
  strokeMiterlimit?: OptionalSignal<number | string>;
  strokeOpacity?: OptionalSignal<number | string>;
  strokeWidth?: OptionalSignal<number | string>;
  surfaceScale?: OptionalSignal<number | string>;
  systemLanguage?: OptionalSignal<number | string>;
  tableValues?: OptionalSignal<number | string>;
  targetX?: OptionalSignal<number | string>;
  targetY?: OptionalSignal<number | string>;
  textAnchor?: OptionalSignal<string>;
  textDecoration?: OptionalSignal<number | string>;
  textLength?: OptionalSignal<number | string>;
  textRendering?: OptionalSignal<number | string>;
  to?: OptionalSignal<number | string>;
  transform?: OptionalSignal<string>;
  u1?: OptionalSignal<number | string>;
  u2?: OptionalSignal<number | string>;
  underlinePosition?: OptionalSignal<number | string>;
  underlineThickness?: OptionalSignal<number | string>;
  unicode?: OptionalSignal<number | string>;
  unicodeBidi?: OptionalSignal<number | string>;
  unicodeRange?: OptionalSignal<number | string>;
  unitsPerEm?: OptionalSignal<number | string>;
  vAlphabetic?: OptionalSignal<number | string>;
  values?: OptionalSignal<string>;
  vectorEffect?: OptionalSignal<number | string>;
  version?: OptionalSignal<string>;
  vertAdvY?: OptionalSignal<number | string>;
  vertOriginX?: OptionalSignal<number | string>;
  vertOriginY?: OptionalSignal<number | string>;
  vHanging?: OptionalSignal<number | string>;
  vIdeographic?: OptionalSignal<number | string>;
  viewBox?: OptionalSignal<string>;
  viewTarget?: OptionalSignal<number | string>;
  visibility?: OptionalSignal<number | string>;
  vMathematical?: OptionalSignal<number | string>;
  widths?: OptionalSignal<number | string>;
  wordSpacing?: OptionalSignal<number | string>;
  writingMode?: OptionalSignal<number | string>;
  x1?: OptionalSignal<number | string>;
  x2?: OptionalSignal<number | string>;
  x?: OptionalSignal<number | string>;
  xChannelSelector?: OptionalSignal<string>;
  xHeight?: OptionalSignal<number | string>;
  xlinkActuate?: OptionalSignal<string>;
  xlinkArcrole?: OptionalSignal<string>;
  xlinkHref?: OptionalSignal<string>;
  xlinkRole?: OptionalSignal<string>;
  xlinkShow?: OptionalSignal<string>;
  xlinkTitle?: OptionalSignal<string>;
  xlinkType?: OptionalSignal<string>;
  xmlBase?: OptionalSignal<string>;
  xmlLang?: OptionalSignal<string>;
  xmlns?: OptionalSignal<string>;
  xmlnsXlink?: OptionalSignal<string>;
  xmlSpace?: OptionalSignal<string>;
  y1?: OptionalSignal<number | string>;
  y2?: OptionalSignal<number | string>;
  y?: OptionalSignal<number | string>;
  yChannelSelector?: OptionalSignal<string>;
  z?: OptionalSignal<number | string>;
  zoomAndPan?: OptionalSignal<string>;
}
