import {
  _jsxPropsSym,
  ComponentConstructor,
  defineComponents,
  JsxProps,
  Metadata,
} from "../component.js";
import { createContext, useContext } from "../context.js";
import { createTemplate, Template, useRenderer } from "../renderer.js";

const tagPrefixContext = createContext<string>();

/**
 * Automatically defines all descendant custom elements of the given template
 * that are not already defined, based on the static `tagName` property of
 * the component.
 *
 * @param prefix The prefix to use for the custom element tag name.
 */
export const autoDefine: ((prefix: string, template: Template) => Template) &
  ((template: Template) => Template) = (
  prefixOrTemplate: string | Template,
  optionalTemplate?: Template,
): Template => {
  const [prefix, template] = optionalTemplate
    ? [prefixOrTemplate as string, optionalTemplate]
    : ["", prefixOrTemplate as Template];

  return tagPrefixContext.Provider({
    value: prefix,
    children: template,
  });
};

export const ClassComponent = <M extends Metadata>(
  type: ComponentConstructor<M>,
  props: JsxProps<M>,
) =>
  createTemplate(() => {
    const prefix = useContext(tagPrefixContext);

    if (prefix != null && !(customElements as any).getName(type)) {
      defineComponents(prefix, type);
    }

    const node = useRenderer()._node(() => new type());
    customElements.upgrade(node);

    node[_jsxPropsSym] = props;

    return [node];
  });
