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
