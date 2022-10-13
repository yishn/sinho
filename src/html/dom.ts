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

import type { SignalLike } from "../scope.ts";

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

export interface ElementMap {
  // HTML
  a: [HtmlAttributes, HTMLAnchorElement];
  abbr: [HtmlAttributes, HTMLElement];
  address: [HtmlAttributes, HTMLElement];
  area: [HtmlAttributes, HTMLAreaElement];
  article: [HtmlAttributes, HTMLElement];
  aside: [HtmlAttributes, HTMLElement];
  audio: [HtmlAttributes, HTMLAudioElement];
  b: [HtmlAttributes, HTMLElement];
  base: [HtmlAttributes, HTMLBaseElement];
  bdi: [HtmlAttributes, HTMLElement];
  bdo: [HtmlAttributes, HTMLElement];
  big: [HtmlAttributes, HTMLElement];
  blockquote: [HtmlAttributes, HTMLQuoteElement];
  body: [HtmlAttributes, HTMLBodyElement];
  br: [HtmlAttributes, HTMLBRElement];
  button: [HtmlAttributes, HTMLButtonElement];
  canvas: [HtmlAttributes, HTMLCanvasElement];
  caption: [HtmlAttributes, HTMLTableCaptionElement];
  cite: [HtmlAttributes, HTMLElement];
  code: [HtmlAttributes, HTMLElement];
  col: [HtmlAttributes, HTMLTableColElement];
  colgroup: [HtmlAttributes, HTMLTableColElement];
  data: [HtmlAttributes, HTMLDataElement];
  datalist: [HtmlAttributes, HTMLDataListElement];
  dd: [HtmlAttributes, HTMLElement];
  del: [HtmlAttributes, HTMLModElement];
  details: [HtmlAttributes, HTMLDetailsElement];
  dfn: [HtmlAttributes, HTMLElement];
  dialog: [HtmlAttributes, HTMLDialogElement];
  div: [HtmlAttributes, HTMLDivElement];
  dl: [HtmlAttributes, HTMLDListElement];
  dt: [HtmlAttributes, HTMLElement];
  em: [HtmlAttributes, HTMLElement];
  embed: [HtmlAttributes, HTMLEmbedElement];
  fieldset: [HtmlAttributes, HTMLFieldSetElement];
  figcaption: [HtmlAttributes, HTMLElement];
  figure: [HtmlAttributes, HTMLElement];
  footer: [HtmlAttributes, HTMLElement];
  form: [HtmlAttributes, HTMLFormElement];
  h1: [HtmlAttributes, HTMLHeadingElement];
  h2: [HtmlAttributes, HTMLHeadingElement];
  h3: [HtmlAttributes, HTMLHeadingElement];
  h4: [HtmlAttributes, HTMLHeadingElement];
  h5: [HtmlAttributes, HTMLHeadingElement];
  h6: [HtmlAttributes, HTMLHeadingElement];
  head: [HtmlAttributes, HTMLHeadElement];
  header: [HtmlAttributes, HTMLElement];
  hgroup: [HtmlAttributes, HTMLElement];
  hr: [HtmlAttributes, HTMLHRElement];
  html: [HtmlAttributes, HTMLHtmlElement];
  i: [HtmlAttributes, HTMLElement];
  iframe: [HtmlAttributes, HTMLIFrameElement];
  img: [HtmlAttributes, HTMLImageElement];
  input: [HtmlAttributes, HTMLInputElement];
  ins: [HtmlAttributes, HTMLModElement];
  kbd: [HtmlAttributes, HTMLElement];
  keygen: [HtmlAttributes, HTMLUnknownElement];
  label: [HtmlAttributes, HTMLLabelElement];
  legend: [HtmlAttributes, HTMLLegendElement];
  li: [HtmlAttributes, HTMLLIElement];
  link: [HtmlAttributes, HTMLLinkElement];
  main: [HtmlAttributes, HTMLElement];
  map: [HtmlAttributes, HTMLMapElement];
  mark: [HtmlAttributes, HTMLElement];
  marquee: [HtmlAttributes, HTMLMarqueeElement];
  menu: [HtmlAttributes, HTMLMenuElement];
  menuitem: [HtmlAttributes, HTMLUnknownElement];
  meta: [HtmlAttributes, HTMLMetaElement];
  meter: [HtmlAttributes, HTMLMeterElement];
  nav: [HtmlAttributes, HTMLElement];
  noscript: [HtmlAttributes, HTMLElement];
  object: [HtmlAttributes, HTMLObjectElement];
  ol: [HtmlAttributes, HTMLOListElement];
  optgroup: [HtmlAttributes, HTMLOptGroupElement];
  option: [HtmlAttributes, HTMLOptionElement];
  output: [HtmlAttributes, HTMLOutputElement];
  p: [HtmlAttributes, HTMLParagraphElement];
  param: [HtmlAttributes, HTMLParamElement];
  picture: [HtmlAttributes, HTMLPictureElement];
  pre: [HtmlAttributes, HTMLPreElement];
  progress: [HtmlAttributes, HTMLProgressElement];
  q: [HtmlAttributes, HTMLQuoteElement];
  rp: [HtmlAttributes, HTMLElement];
  rt: [HtmlAttributes, HTMLElement];
  ruby: [HtmlAttributes, HTMLElement];
  s: [HtmlAttributes, HTMLElement];
  samp: [HtmlAttributes, HTMLElement];
  script: [HtmlAttributes, HTMLScriptElement];
  section: [HtmlAttributes, HTMLElement];
  select: [HtmlAttributes, HTMLSelectElement];
  slot: [HtmlAttributes, HTMLSlotElement];
  small: [HtmlAttributes, HTMLElement];
  source: [HtmlAttributes, HTMLSourceElement];
  span: [HtmlAttributes, HTMLSpanElement];
  strong: [HtmlAttributes, HTMLElement];
  style: [HtmlAttributes, HTMLStyleElement];
  sub: [HtmlAttributes, HTMLElement];
  summary: [HtmlAttributes, HTMLElement];
  sup: [HtmlAttributes, HTMLElement];
  table: [HtmlAttributes, HTMLTableElement];
  tbody: [HtmlAttributes, HTMLTableSectionElement];
  td: [HtmlAttributes, HTMLTableCellElement];
  textarea: [HtmlAttributes, HTMLTextAreaElement];
  tfoot: [HtmlAttributes, HTMLTableSectionElement];
  th: [HtmlAttributes, HTMLTableCellElement];
  thead: [HtmlAttributes, HTMLTableSectionElement];
  time: [HtmlAttributes, HTMLTimeElement];
  title: [HtmlAttributes, HTMLTitleElement];
  tr: [HtmlAttributes, HTMLTableRowElement];
  track: [HtmlAttributes, HTMLTrackElement];
  u: [HtmlAttributes, HTMLElement];
  ul: [HtmlAttributes, HTMLUListElement];
  var: [HtmlAttributes, HTMLElement];
  video: [HtmlAttributes, HTMLVideoElement];
  wbr: [HtmlAttributes, HTMLElement];

  //SVG
  svg: [SvgAttributes, SVGSVGElement];
  animate: [SvgAttributes, SVGAnimateElement];
  circle: [SvgAttributes, SVGCircleElement];
  animateTransform: [SvgAttributes, SVGAnimateElement];
  clipPath: [SvgAttributes, SVGClipPathElement];
  defs: [SvgAttributes, SVGDefsElement];
  desc: [SvgAttributes, SVGDescElement];
  ellipse: [SvgAttributes, SVGEllipseElement];
  feBlend: [SvgAttributes, SVGFEBlendElement];
  feColorMatrix: [SvgAttributes, SVGFEColorMatrixElement];
  feComponentTransfer: [SvgAttributes, SVGFEComponentTransferElement];
  feComposite: [SvgAttributes, SVGFECompositeElement];
  feConvolveMatrix: [SvgAttributes, SVGFEConvolveMatrixElement];
  feDiffuseLighting: [SvgAttributes, SVGFEDiffuseLightingElement];
  feDisplacementMap: [SvgAttributes, SVGFEDisplacementMapElement];
  feDropShadow: [SvgAttributes, SVGFEDropShadowElement];
  feFlood: [SvgAttributes, SVGFEFloodElement];
  feFuncA: [SvgAttributes, SVGFEFuncAElement];
  feFuncB: [SvgAttributes, SVGFEFuncBElement];
  feFuncG: [SvgAttributes, SVGFEFuncGElement];
  feFuncR: [SvgAttributes, SVGFEFuncRElement];
  feGaussianBlur: [SvgAttributes, SVGFEGaussianBlurElement];
  feImage: [SvgAttributes, SVGFEImageElement];
  feMerge: [SvgAttributes, SVGFEMergeElement];
  feMergeNode: [SvgAttributes, SVGFEMergeNodeElement];
  feMorphology: [SvgAttributes, SVGFEMorphologyElement];
  feOffset: [SvgAttributes, SVGFEOffsetElement];
  feSpecularLighting: [SvgAttributes, SVGFESpecularLightingElement];
  feTile: [SvgAttributes, SVGFETileElement];
  feTurbulence: [SvgAttributes, SVGFETurbulenceElement];
  filter: [SvgAttributes, SVGFilterElement];
  foreignObject: [SvgAttributes, SVGForeignObjectElement];
  g: [SvgAttributes, SVGGElement];
  image: [SvgAttributes, SVGImageElement];
  line: [SvgAttributes, SVGLineElement];
  linearGradient: [SvgAttributes, SVGLinearGradientElement];
  marker: [SvgAttributes, SVGMarkerElement];
  mask: [SvgAttributes, SVGMaskElement];
  path: [SvgAttributes, SVGPathElement];
  pattern: [SvgAttributes, SVGPatternElement];
  polygon: [SvgAttributes, SVGPolygonElement];
  polyline: [SvgAttributes, SVGPolylineElement];
  radialGradient: [SvgAttributes, SVGRadialGradientElement];
  rect: [SvgAttributes, SVGRectElement];
  stop: [SvgAttributes, SVGStopElement];
  symbol: [SvgAttributes, SVGSymbolElement];
  text: [SvgAttributes, SVGTextElement];
  textPath: [SvgAttributes, SVGTextPathElement];
  tspan: [SvgAttributes, SVGTSpanElement];
  use: [SvgAttributes, SVGUseElement];
}

interface HtmlAttributes {
  // Standard HTML Attributes
  accept?: SignalLike<string>;
  acceptCharset?: SignalLike<string>;
  accessKey?: SignalLike<string>;
  action?: SignalLike<string>;
  allow?: SignalLike<string>;
  allowFullScreen?: SignalLike<boolean>;
  allowTransparency?: SignalLike<boolean>;
  alt?: SignalLike<string>;
  as?: SignalLike<string>;
  async?: SignalLike<boolean>;
  autocomplete?: SignalLike<string>;
  autoComplete?: SignalLike<string>;
  autocorrect?: SignalLike<string>;
  autoCorrect?: SignalLike<string>;
  autofocus?: SignalLike<boolean>;
  autoFocus?: SignalLike<boolean>;
  autoPlay?: SignalLike<boolean>;
  capture?: SignalLike<string>;
  cellPadding?: SignalLike<string>;
  cellSpacing?: SignalLike<string>;
  charSet?: SignalLike<string>;
  challenge?: SignalLike<string>;
  checked?: SignalLike<boolean>;
  cite?: SignalLike<string>;
  class?: SignalLike<string | undefined>;
  className?: SignalLike<string | undefined>;
  cols?: SignalLike<number>;
  colSpan?: SignalLike<number>;
  content?: SignalLike<string>;
  contentEditable?: SignalLike<boolean>;
  contextMenu?: SignalLike<string>;
  controls?: SignalLike<boolean>;
  controlsList?: SignalLike<string>;
  coords?: SignalLike<string>;
  crossOrigin?: SignalLike<string>;
  data?: SignalLike<string>;
  dateTime?: SignalLike<string>;
  default?: SignalLike<boolean>;
  defaultChecked?: SignalLike<boolean>;
  defaultValue?: SignalLike<string>;
  defer?: SignalLike<boolean>;
  dir?: SignalLike<"auto" | "rtl" | "ltr">;
  disabled?: SignalLike<boolean>;
  disableRemotePlayback?: SignalLike<boolean>;
  download?: SignalLike<any>;
  decoding?: SignalLike<"sync" | "async" | "auto">;
  draggable?: SignalLike<boolean>;
  encType?: SignalLike<string>;
  enterkeyhint?: SignalLike<
    "enter" | "done" | "go" | "next" | "previous" | "search" | "send"
  >;
  form?: SignalLike<string>;
  formAction?: SignalLike<string>;
  formEncType?: SignalLike<string>;
  formMethod?: SignalLike<string>;
  formNoValidate?: SignalLike<boolean>;
  formTarget?: SignalLike<string>;
  frameBorder?: SignalLike<number | string>;
  headers?: SignalLike<string>;
  height?: SignalLike<number | string>;
  hidden?: SignalLike<boolean>;
  high?: SignalLike<number>;
  href?: SignalLike<string>;
  hrefLang?: SignalLike<string>;
  for?: SignalLike<string>;
  htmlFor?: SignalLike<string>;
  httpEquiv?: SignalLike<string>;
  icon?: SignalLike<string>;
  id?: SignalLike<string>;
  inputMode?: SignalLike<string>;
  integrity?: SignalLike<string>;
  is?: SignalLike<string>;
  keyParams?: SignalLike<string>;
  keyType?: SignalLike<string>;
  kind?: SignalLike<string>;
  label?: SignalLike<string>;
  lang?: SignalLike<string>;
  list?: SignalLike<string>;
  loading?: SignalLike<"eager" | "lazy">;
  loop?: SignalLike<boolean>;
  low?: SignalLike<number>;
  manifest?: SignalLike<string>;
  marginHeight?: SignalLike<number>;
  marginWidth?: SignalLike<number>;
  max?: SignalLike<string>;
  maxLength?: SignalLike<number>;
  media?: SignalLike<string>;
  mediaGroup?: SignalLike<string>;
  method?: SignalLike<string>;
  min?: SignalLike<string>;
  minLength?: SignalLike<number>;
  multiple?: SignalLike<boolean>;
  muted?: SignalLike<boolean>;
  name?: SignalLike<string>;
  nomodule?: SignalLike<boolean>;
  nonce?: SignalLike<string>;
  noValidate?: SignalLike<boolean>;
  open?: SignalLike<boolean>;
  optimum?: SignalLike<number>;
  part?: SignalLike<string>;
  pattern?: SignalLike<string>;
  ping?: SignalLike<string>;
  placeholder?: SignalLike<string>;
  playsInline?: SignalLike<boolean>;
  poster?: SignalLike<string>;
  preload?: SignalLike<string>;
  radioGroup?: SignalLike<string>;
  readonly?: SignalLike<boolean>;
  readOnly?: SignalLike<boolean>;
  referrerpolicy?: SignalLike<
    | "no-referrer"
    | "no-referrer-when-downgrade"
    | "origin"
    | "origin-when-cross-origin"
    | "same-origin"
    | "strict-origin"
    | "strict-origin-when-cross-origin"
    | "unsafe-url"
  >;
  rel?: SignalLike<string>;
  required?: SignalLike<boolean>;
  reversed?: SignalLike<boolean>;
  role?: SignalLike<string>;
  rows?: SignalLike<number>;
  rowSpan?: SignalLike<number>;
  sandbox?: SignalLike<string>;
  scope?: SignalLike<string>;
  scoped?: SignalLike<boolean>;
  scrolling?: SignalLike<string>;
  seamless?: SignalLike<boolean>;
  selected?: SignalLike<boolean>;
  shape?: SignalLike<string>;
  size?: SignalLike<number>;
  sizes?: SignalLike<string>;
  slot?: SignalLike<string>;
  span?: SignalLike<number>;
  spellcheck?: SignalLike<boolean>;
  spellCheck?: SignalLike<boolean>;
  src?: SignalLike<string>;
  srcset?: SignalLike<string>;
  srcDoc?: SignalLike<string>;
  srcLang?: SignalLike<string>;
  srcSet?: SignalLike<string>;
  start?: SignalLike<number>;
  step?: SignalLike<number | string>;
  summary?: SignalLike<string>;
  tabIndex?: SignalLike<number>;
  target?: SignalLike<string>;
  title?: SignalLike<string>;
  type?: SignalLike<string>;
  useMap?: SignalLike<string>;
  value?: SignalLike<string | string[] | number>;
  volume?: SignalLike<string | number>;
  width?: SignalLike<number | string>;
  wmode?: SignalLike<string>;
  wrap?: SignalLike<string>;

  // Non-standard Attributes
  autocapitalize?: SignalLike<
    "off" | "none" | "on" | "sentences" | "words" | "characters"
  >;
  autoCapitalize?: SignalLike<
    "off" | "none" | "on" | "sentences" | "words" | "characters"
  >;
  disablePictureInPicture?: SignalLike<boolean>;
  results?: SignalLike<number>;
  translate?: SignalLike<"yes" | "no">;

  // RDFa Attributes
  about?: SignalLike<string>;
  datatype?: SignalLike<string>;
  inlist?: SignalLike<any>;
  prefix?: SignalLike<string>;
  property?: SignalLike<string>;
  resource?: SignalLike<string>;
  typeof?: SignalLike<string>;
  vocab?: SignalLike<string>;

  // Microdata Attributes
  itemProp?: SignalLike<string>;
  itemScope?: SignalLike<boolean>;
  itemType?: SignalLike<string>;
  itemID?: SignalLike<string>;
  itemRef?: SignalLike<string>;
}

interface SvgAttributes extends HtmlAttributes {
  accentHeight?: SignalLike<number | string>;
  accumulate?: SignalLike<"none" | "sum">;
  additive?: SignalLike<"replace" | "sum">;
  alignmentBaseline?: SignalLike<
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
  allowReorder?: SignalLike<"no" | "yes">;
  alphabetic?: SignalLike<number | string>;
  amplitude?: SignalLike<number | string>;
  arabicForm?: SignalLike<"initial" | "medial" | "terminal" | "isolated">;
  ascent?: SignalLike<number | string>;
  attributeName?: SignalLike<string>;
  attributeType?: SignalLike<string>;
  autoReverse?: SignalLike<number | string>;
  azimuth?: SignalLike<number | string>;
  baseFrequency?: SignalLike<number | string>;
  baselineShift?: SignalLike<number | string>;
  baseProfile?: SignalLike<number | string>;
  bbox?: SignalLike<number | string>;
  begin?: SignalLike<number | string>;
  bias?: SignalLike<number | string>;
  by?: SignalLike<number | string>;
  calcMode?: SignalLike<number | string>;
  capHeight?: SignalLike<number | string>;
  clip?: SignalLike<number | string>;
  clipPath?: SignalLike<string>;
  clipPathUnits?: SignalLike<number | string>;
  clipRule?: SignalLike<number | string>;
  colorInterpolation?: SignalLike<number | string>;
  colorInterpolationFilters?: SignalLike<
    "auto" | "sRGB" | "linearRGB" | "inherit"
  >;
  colorProfile?: SignalLike<number | string>;
  colorRendering?: SignalLike<number | string>;
  contentScriptType?: SignalLike<number | string>;
  contentStyleType?: SignalLike<number | string>;
  cursor?: SignalLike<number | string>;
  cx?: SignalLike<number | string>;
  cy?: SignalLike<number | string>;
  d?: SignalLike<string>;
  decelerate?: SignalLike<number | string>;
  descent?: SignalLike<number | string>;
  diffuseConstant?: SignalLike<number | string>;
  direction?: SignalLike<number | string>;
  display?: SignalLike<number | string>;
  divisor?: SignalLike<number | string>;
  dominantBaseline?: SignalLike<number | string>;
  dur?: SignalLike<number | string>;
  dx?: SignalLike<number | string>;
  dy?: SignalLike<number | string>;
  edgeMode?: SignalLike<number | string>;
  elevation?: SignalLike<number | string>;
  enableBackground?: SignalLike<number | string>;
  end?: SignalLike<number | string>;
  exponent?: SignalLike<number | string>;
  externalResourcesRequired?: SignalLike<number | string>;
  fill?: SignalLike<string>;
  fillOpacity?: SignalLike<number | string>;
  fillRule?: SignalLike<"nonzero" | "evenodd" | "inherit">;
  filter?: SignalLike<string>;
  filterRes?: SignalLike<number | string>;
  filterUnits?: SignalLike<number | string>;
  floodColor?: SignalLike<number | string>;
  floodOpacity?: SignalLike<number | string>;
  focusable?: SignalLike<number | string>;
  fontFamily?: SignalLike<string>;
  fontSize?: SignalLike<number | string>;
  fontSizeAdjust?: SignalLike<number | string>;
  fontStretch?: SignalLike<number | string>;
  fontStyle?: SignalLike<number | string>;
  fontVariant?: SignalLike<number | string>;
  fontWeight?: SignalLike<number | string>;
  format?: SignalLike<number | string>;
  from?: SignalLike<number | string>;
  fx?: SignalLike<number | string>;
  fy?: SignalLike<number | string>;
  g1?: SignalLike<number | string>;
  g2?: SignalLike<number | string>;
  glyphName?: SignalLike<number | string>;
  glyphOrientationHorizontal?: SignalLike<number | string>;
  glyphOrientationVertical?: SignalLike<number | string>;
  glyphRef?: SignalLike<number | string>;
  gradientTransform?: SignalLike<string>;
  gradientUnits?: SignalLike<string>;
  hanging?: SignalLike<number | string>;
  horizAdvX?: SignalLike<number | string>;
  horizOriginX?: SignalLike<number | string>;
  ideographic?: SignalLike<number | string>;
  imageRendering?: SignalLike<number | string>;
  in2?: SignalLike<number | string>;
  in?: SignalLike<string>;
  intercept?: SignalLike<number | string>;
  k1?: SignalLike<number | string>;
  k2?: SignalLike<number | string>;
  k3?: SignalLike<number | string>;
  k4?: SignalLike<number | string>;
  k?: SignalLike<number | string>;
  kernelMatrix?: SignalLike<number | string>;
  kernelUnitLength?: SignalLike<number | string>;
  kerning?: SignalLike<number | string>;
  keyPoints?: SignalLike<number | string>;
  keySplines?: SignalLike<number | string>;
  keyTimes?: SignalLike<number | string>;
  lengthAdjust?: SignalLike<number | string>;
  letterSpacing?: SignalLike<number | string>;
  lightingColor?: SignalLike<number | string>;
  limitingConeAngle?: SignalLike<number | string>;
  local?: SignalLike<number | string>;
  markerEnd?: SignalLike<string>;
  markerHeight?: SignalLike<number | string>;
  markerMid?: SignalLike<string>;
  markerStart?: SignalLike<string>;
  markerUnits?: SignalLike<number | string>;
  markerWidth?: SignalLike<number | string>;
  mask?: SignalLike<string>;
  maskContentUnits?: SignalLike<number | string>;
  maskUnits?: SignalLike<number | string>;
  mathematical?: SignalLike<number | string>;
  mode?: SignalLike<number | string>;
  numOctaves?: SignalLike<number | string>;
  offset?: SignalLike<number | string>;
  opacity?: SignalLike<number | string>;
  operator?: SignalLike<number | string>;
  order?: SignalLike<number | string>;
  orient?: SignalLike<number | string>;
  orientation?: SignalLike<number | string>;
  origin?: SignalLike<number | string>;
  overflow?: SignalLike<number | string>;
  overlinePosition?: SignalLike<number | string>;
  overlineThickness?: SignalLike<number | string>;
  paintOrder?: SignalLike<number | string>;
  panose1?: SignalLike<number | string>;
  pathLength?: SignalLike<number | string>;
  patternContentUnits?: SignalLike<string>;
  patternTransform?: SignalLike<number | string>;
  patternUnits?: SignalLike<string>;
  pointerEvents?: SignalLike<number | string>;
  points?: SignalLike<string>;
  pointsAtX?: SignalLike<number | string>;
  pointsAtY?: SignalLike<number | string>;
  pointsAtZ?: SignalLike<number | string>;
  preserveAlpha?: SignalLike<number | string>;
  preserveAspectRatio?: SignalLike<string>;
  primitiveUnits?: SignalLike<number | string>;
  r?: SignalLike<number | string>;
  radius?: SignalLike<number | string>;
  refX?: SignalLike<number | string>;
  refY?: SignalLike<number | string>;
  renderingIntent?: SignalLike<number | string>;
  repeatCount?: SignalLike<number | string>;
  repeatDur?: SignalLike<number | string>;
  requiredExtensions?: SignalLike<number | string>;
  requiredFeatures?: SignalLike<number | string>;
  restart?: SignalLike<number | string>;
  result?: SignalLike<string>;
  rotate?: SignalLike<number | string>;
  rx?: SignalLike<number | string>;
  ry?: SignalLike<number | string>;
  scale?: SignalLike<number | string>;
  seed?: SignalLike<number | string>;
  shapeRendering?: SignalLike<number | string>;
  slope?: SignalLike<number | string>;
  spacing?: SignalLike<number | string>;
  specularConstant?: SignalLike<number | string>;
  specularExponent?: SignalLike<number | string>;
  speed?: SignalLike<number | string>;
  spreadMethod?: SignalLike<string>;
  startOffset?: SignalLike<number | string>;
  stdDeviation?: SignalLike<number | string>;
  stemh?: SignalLike<number | string>;
  stemv?: SignalLike<number | string>;
  stitchTiles?: SignalLike<number | string>;
  stopColor?: SignalLike<string>;
  stopOpacity?: SignalLike<number | string>;
  strikethroughPosition?: SignalLike<number | string>;
  strikethroughThickness?: SignalLike<number | string>;
  string?: SignalLike<number | string>;
  stroke?: SignalLike<string>;
  strokeDasharray?: SignalLike<number | string>;
  strokeDashoffset?: SignalLike<number | string>;
  strokeLinecap?: SignalLike<"butt" | "round" | "square" | "inherit">;
  strokeLinejoin?: SignalLike<"miter" | "round" | "bevel" | "inherit">;
  strokeMiterlimit?: SignalLike<number | string>;
  strokeOpacity?: SignalLike<number | string>;
  strokeWidth?: SignalLike<number | string>;
  surfaceScale?: SignalLike<number | string>;
  systemLanguage?: SignalLike<number | string>;
  tableValues?: SignalLike<number | string>;
  targetX?: SignalLike<number | string>;
  targetY?: SignalLike<number | string>;
  textAnchor?: SignalLike<string>;
  textDecoration?: SignalLike<number | string>;
  textLength?: SignalLike<number | string>;
  textRendering?: SignalLike<number | string>;
  to?: SignalLike<number | string>;
  transform?: SignalLike<string>;
  u1?: SignalLike<number | string>;
  u2?: SignalLike<number | string>;
  underlinePosition?: SignalLike<number | string>;
  underlineThickness?: SignalLike<number | string>;
  unicode?: SignalLike<number | string>;
  unicodeBidi?: SignalLike<number | string>;
  unicodeRange?: SignalLike<number | string>;
  unitsPerEm?: SignalLike<number | string>;
  vAlphabetic?: SignalLike<number | string>;
  values?: SignalLike<string>;
  vectorEffect?: SignalLike<number | string>;
  version?: SignalLike<string>;
  vertAdvY?: SignalLike<number | string>;
  vertOriginX?: SignalLike<number | string>;
  vertOriginY?: SignalLike<number | string>;
  vHanging?: SignalLike<number | string>;
  vIdeographic?: SignalLike<number | string>;
  viewBox?: SignalLike<string>;
  viewTarget?: SignalLike<number | string>;
  visibility?: SignalLike<number | string>;
  vMathematical?: SignalLike<number | string>;
  widths?: SignalLike<number | string>;
  wordSpacing?: SignalLike<number | string>;
  writingMode?: SignalLike<number | string>;
  x1?: SignalLike<number | string>;
  x2?: SignalLike<number | string>;
  x?: SignalLike<number | string>;
  xChannelSelector?: SignalLike<string>;
  xHeight?: SignalLike<number | string>;
  xlinkActuate?: SignalLike<string>;
  xlinkArcrole?: SignalLike<string>;
  xlinkHref?: SignalLike<string>;
  xlinkRole?: SignalLike<string>;
  xlinkShow?: SignalLike<string>;
  xlinkTitle?: SignalLike<string>;
  xlinkType?: SignalLike<string>;
  xmlBase?: SignalLike<string>;
  xmlLang?: SignalLike<string>;
  xmlns?: SignalLike<string>;
  xmlnsXlink?: SignalLike<string>;
  xmlSpace?: SignalLike<string>;
  y1?: SignalLike<number | string>;
  y2?: SignalLike<number | string>;
  y?: SignalLike<number | string>;
  yChannelSelector?: SignalLike<string>;
  z?: SignalLike<number | string>;
  zoomAndPan?: SignalLike<string>;
}
