import {
  Cleanup,
  MaybeSignal,
  Signal,
  useEffect,
  useSubscope,
  useSignal,
} from "./scope.js";
import type { DomEventProps, DomProps } from "./dom.js";
import { runWithRenderer } from "./renderer.js";
import {
  camelCaseToKebabCase,
  JsxPropNameToEventName,
  jsxPropNameToEventName,
} from "./utils.js";
import { useScope } from "./scope.js";
import { Context, isContext, provideContext } from "./context.js";
import { Template } from "./template.js";

interface Tagged<in out T> {
  _tag: T;
}

type OmitNever<T> = Omit<
  T,
  { [K in keyof T]: T[K] extends never ? K : never }[keyof T]
>;

type PartialRequire<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/** @ignore */
export interface PropMeta<T> extends PropOptions<T>, Tagged<"p"> {
  _type?: [T];
  _defaultOrContext: T;
}

export interface AttributeOptions<T> {
  /**
   * The name of the attribute to observe.
   *
   * Defaults to the kebab-case version of the prop.
   */
  name?: string;
  /**
   * A function to transform the attribute value to the prop value.
   */
  transform: (value: string) => T;
  /**
   * Set to `true` to not observe the attribute for changes.
   *
   * @default false
   */
  static?: boolean;
}

type PartialPartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export interface PropOptions<T> {
  attribute?:
    | ((value: string) => T)
    | (string extends T
        ? PartialPartial<AttributeOptions<T>, "transform">
        : AttributeOptions<T>);
}

type Props<M> = OmitNever<{
  readonly [K in keyof M]: M[K] extends PropMeta<infer T> ? Signal<T> : never;
}>;

export type EventConstructor<T = any, E = Event> = new (
  name: string,
  arg: T,
) => E;

/** @ignore */
export interface EventMeta<out E extends EventConstructor> extends Tagged<"e"> {
  _event: E;
}

type Events<M> = OmitNever<
  Omit<
    {
      readonly [K in keyof M]: K extends `on${string}`
        ? M[K] extends EventMeta<infer E>
          ? E
          : never
        : never;
    },
    `on${Lowercase<keyof HTMLElementEventMap>}`
  >
>;

type GeneralJsxProps<T> = Partial<
  OmitNever<{
    [K in keyof T]: K extends
      | typeof jsxPropsSym
      | keyof DomProps<any>
      | `on${string}`
      // Readonly HTMLElement properties
      | `${Uppercase<infer _>}${string}`
      | "accessKeyLabel"
      | "offsetHeight"
      | "offsetLeft"
      | "offsetParent"
      | "offsetTop"
      | "offsetWidth"
      | "attributes"
      | "classList"
      | "clientHeight"
      | "clientLeft"
      | "clientTop"
      | "clientWidth"
      | "localName"
      | "namespaceURI"
      | "ownerDocument"
      | "part"
      | "prefix"
      | "scrollHeight"
      | "scrollWidth"
      | "shadowRoot"
      | "tagName"
      | "baseURI"
      | "childNodes"
      | "firstChild"
      | "isConnected"
      | "lastChild"
      | "nextSibling"
      | "nodeName"
      | "nodeType"
      | "parentElement"
      | "parentNode"
      | "previousSibling"
      | "nextElementSibling"
      | "previousElementSibling"
      | "childElementCount"
      | "firstElementChild"
      | "lastElementChild"
      | "assignedSlot"
      | "attributeStyleMap"
      | "isContentEditable"
      | "dataset"
      ? never
      : T[K] extends Function
        ? never
        : MaybeSignal<T[K]>;
  }>
> &
  DomProps<any> &
  DomEventProps<never> &
  // Allow other HTMLElement attributes
  Record<string, any>;

declare global {
  interface HTMLElement {
    readonly [jsxPropsSym]?: GeneralJsxProps<this>;
  }
}

export type JsxProps<T extends HTMLElement> = typeof jsxPropsSym extends keyof T
  ? NonNullable<T[typeof jsxPropsSym]>
  : never;

type ComponentJsxProps<M> = Partial<
  OmitNever<{
    [K in keyof Props<M>]: Props<M>[K] extends Signal<infer T>
      ? MaybeSignal<T>
      : never;
  }> & {
    [K in keyof Events<M>]: (evt: InstanceType<Events<M>[K]>) => void;
  }
> &
  GeneralJsxProps<HTMLElement>;

type EventEmitters<M> = OmitNever<
  Omit<
    {
      [K in keyof Events<M>]: Events<M>[K] extends EventConstructor<infer E>
        ? undefined extends E
          ? (arg?: E) => boolean
          : (arg: E) => boolean
        : never;
    },
    `on${Lowercase<keyof HTMLElementEventMap>}`
  >
>;

/**
 * Defines a property in your component metadata that can be set from outside
 * of the component.
 *
 * Make sure to avoid conflicts with native `HTMLElement` properties.
 *
 * You can get properties by accessing the {@link Signal} in `this.props`.
 * It's also possible to set the properties directly on the component instance.
 *
 * It's also possible to define an attribute for the property by setting the
 * `attribute` option. By default, the attribute name is the kebab-case version
 * of the property name. The attribute will be observed and the signal updated
 * on changes. You can also provide a custom name and a transform function to
 * convert the attribute value to the property value.
 *
 * @example
 * ```tsx
 * class App extends Component("x-app", {
 *   greetingMessage: prop<string>("Hello, world!", {
 *     attribute: {
 *       name: "greeting",
 *     }
 *   }),
 * }) {
 *   render() {
 *     return <h1>{this.props.greetingMessage}</h1>;
 *   }
 * }
 *
 * defineComponents(App);
 *
 * const app = new App();
 * app.greetingMessage = "Hello, universe!";
 * ```
 */
export const prop: (<T>(
  context: Context<T>,
  opts?: PropOptions<T>,
) => PropMeta<T | undefined>) &
  (<T>(defaultValue: T, opts?: PropOptions<T>) => PropMeta<T>) &
  (<T>(
    defaultValue?: T,
    opts?: PropOptions<T | undefined>,
  ) => PropMeta<T | undefined>) = <T>(
  defaultOrContext?: Context<T> | T,
  opts?: PropOptions<T>,
): PropMeta<any> => ({
  _tag: "p",
  _defaultOrContext: defaultOrContext,
  ...opts,
});

// CustomEvent<T> has a flaw in its constructor signature since it allows
// `detail` to be optional. This is a workaround to make it required unless
// `undefined` can be assigned to `T`.

type _CustomEventContructor<T> = undefined extends T
  ? typeof CustomEvent<T>
  : EventConstructor<
      PartialRequire<CustomEventInit<T>, "detail">,
      CustomEvent<T>
    >;

/**
 * Defines an event in your component metadata that can be dispatched by
 * the component.
 *
 * Make sure your event name starts with `on` and to avoid conflicts with
 * native `HTMLElement` events. The event name will be converted to kebab-case.
 *
 * You can dispatch events either using `HTMLElement.dispatchEvent` or by
 * calling the event emitter function in `this.events` inside the `render`
 * function of a component.
 *
 * @example
 * ```tsx
 * class App extends Component("x-app", {
 *   onSomethingHappen: event<string>(),
 *   // Event name will be `something-happen`
 * }) {
 *   render() {
 *     // …
 *     this.events.onSomethingHappen({ detail: "Something happened! "});
 *   }
 * }
 *
 * const app = new App();
 * app.addEventListener("something-happen", (evt) => {
 *   // `evt` is `CustomEvent<string>`
 *   console.log(evt.detail);
 * });
 * ```
 *
 * You can also provide a custom event constructor:
 *
 * @example
 * ```tsx
 * class App extends Component("x-app", {
 *   onSomethingClick: event(() => MouseEvent),
 * }) {
 *   render() {
 *     return (
 *       <button onclick={evt => this.events.onSomethingClick(evt)}>
 *         Click me!
 *       </button>
 *     );
 *   }
 * }
 * ```
 */
export const event: (() => EventMeta<_CustomEventContructor<undefined>>) &
  (<T>() => EventMeta<_CustomEventContructor<T>>) &
  (<E extends EventConstructor>(eventConstructor: E) => EventMeta<E>) = ((
  eventConstructor: EventConstructor = CustomEvent,
): EventMeta<EventConstructor> => ({
  _tag: "e",
  _event: eventConstructor,
})) as any;

export type Metadata = {
  // Forbid all library properties
  [K in keyof ComponentInner<any> | "props" | "events"]?: never;
} & {
  // Forbid all dom props
  [K in keyof DomProps<any>]?: never;
} & {
  // Forbid all HTMLElement props
  [K in keyof HTMLElement]?: never;
} & {
  [name: string]: PropMeta<any> | EventMeta<any>;
};

export const componentSym = Symbol("Component");
export declare const jsxPropsSym: unique symbol;

declare abstract class ComponentInner<M extends Metadata> {
  protected props: Props<M>;
  protected events: EventEmitters<M>;

  readonly [jsxPropsSym]?: ComponentJsxProps<M>;
  readonly [componentSym]: {
    _scope?: ReturnType<typeof useScope>;
    _destroy?: (() => void) | void;
  };

  connectedCallback(): void;
  disconnectedCallback(): void;
  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    value: string | null,
  ): void;

  addEventListener<K extends keyof Events<M> & string>(
    type: JsxPropNameToEventName<K>,
    listener: (event: InstanceType<Events<M>[K]>) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener<K extends keyof Events<M> & string>(
    type: JsxPropNameToEventName<K>,
    listener: (event: InstanceType<Events<M>[K]>) => void,
    options?: boolean | EventListenerOptions,
  ): void;

  abstract render(): Template;
}

export type Component<M extends Metadata = {}> = {
  -readonly [K in keyof Props<M>]: Props<M>[K] extends Signal<infer T>
    ? T
    : never;
} & ComponentInner<M> &
  HTMLElement;

export interface ComponentConstructor<M extends Metadata = {}> {
  /** @ignore */
  readonly [componentSym]: {
    readonly _tagName: string;
  };
  readonly observedAttributes: readonly string[];

  new (): Component<M>;
}

export interface ComponentOptions {
  /**
   * Shadow DOM options. Set to `false` to disable shadow DOM.
   *
   * @default { mode: "open" }
   */
  shadow?: ShadowRootInit | false;
}

let mountEffects: [fn: () => Cleanup, deps?: Signal<unknown>[]][] | undefined;

/**
 * Creates an effect which will rerun when any accessed signal changes.
 *
 * If used inside of a component and the component is not yet mounted, the
 * effect will run only after the component is mounted. Otherwise, the effect
 * will run immediately.
 *
 * @param fn The function to run; it may return a cleanup function.
 */
export const useMountEffect = (
  fn: () => Cleanup,
  deps?: Signal<unknown>[],
): void => {
  if (mountEffects) {
    mountEffects.push([fn, deps]);
  } else {
    useEffect(fn, deps);
  }
};

/**
 * Creates a new web component class.
 *
 * Specify props and events using the `metadata` parameter.
 *
 * @example
 * ```tsx
 * class MyComponent extends Component("my-component", {
 *   myProp: prop<string>("Hello, world!"),
 *   onMyEvent: event(),
 * }) {
 *   render() {
 *     return (
 *       <>
 *         <h1>{this.props.myProp}</h1>
 *         <button onclick={() => this.events.onMyEvent()}>Click me</button>
 *       </>
 *     );
 *   },
 * }
 *
 * customElements.define("my-component", MyComponent);
 * ```
 */
export const Component: ((tagName: string) => ComponentConstructor<{}>) &
  (<const M extends Metadata>(
    tagName: string,
    metadata: M,
    opts?: ComponentOptions,
  ) => ComponentConstructor<M>) = ((
  tagName: string,
  metadata: Metadata = {},
  opts: ComponentOptions = {},
): ComponentConstructor => {
  // Extract attribute information

  const observedAttributes: string[] = [];
  const attributePropMap = new Map<
    string,
    {
      name: string;
      meta: PropMeta<any> & {
        attribute: Required<
          NonNullable<Exclude<PropMeta<any>["attribute"], boolean | Function>>
        >;
      };
    }
  >();

  for (const name in metadata) {
    const meta = metadata[name] as PropMeta<any> | EventMeta<any>;

    if (meta._tag == "p" && meta.attribute) {
      if (typeof meta.attribute == "function") {
        meta.attribute = { transform: meta.attribute };
      }

      const attribute: AttributeOptions<any> = (meta.attribute = {
        name: camelCaseToKebabCase(name),
        static: false,
        transform: (x) => x,
        ...meta.attribute,
      });

      attributePropMap.set(attribute.name!, {
        name,
        meta: meta as any,
      });

      if (!attribute.static) {
        observedAttributes.push(attribute.name!);
      }
    }
  }

  // Create base class

  opts.shadow ??= { mode: "open" };

  const getRenderParent = (component: _Component) =>
    opts.shadow
      ? component.shadowRoot ?? component.attachShadow(opts.shadow)
      : component;
  abstract class _Component extends HTMLElement {
    static readonly [componentSym]: ComponentConstructor[typeof componentSym] =
      {
        _tagName: tagName,
      };
    static readonly observedAttributes: readonly string[] = observedAttributes;

    protected props: Record<string, Signal<any>> = {};
    protected events: Record<string, (arg: unknown) => any> = {};

    readonly [componentSym]: ComponentInner<any>[typeof componentSym] = {};

    constructor() {
      super();

      for (const name in metadata) {
        const meta = metadata[name];

        if (meta._tag == "p") {
          const context = isContext(meta._defaultOrContext)
            ? meta._defaultOrContext
            : null;
          const [getter, setter] = useSignal<unknown>(
            context ? undefined : meta._defaultOrContext,
          );

          this.props[name] = getter;

          if (context) {
            provideContext(context, this, getter);
          }

          Object.defineProperty(this, name, {
            get: getter.peek,
            set: (value) => setter(() => value, { force: true }),
          });
        } else if (meta._tag == "e" && name.startsWith("on")) {
          const eventName = jsxPropNameToEventName(name as `on${string}`);

          this.events[name] = (arg: unknown) =>
            this.dispatchEvent(new meta._event(eventName, arg));
        }
      }
    }

    connectedCallback(): void {
      const renderParent = getRenderParent(this);

      this[componentSym]._destroy = useSubscope(() =>
        runWithRenderer(
          {
            _svg: false,
            _component: this as any,
            _nodes: renderParent.childNodes.values(),
          },
          () => {
            this[componentSym]._scope = useScope();

            // Render

            const prevMountEffects = mountEffects;
            mountEffects = [];

            try {
              renderParent?.append(...this.render().build());

              // Run mount effects

              mountEffects.forEach(([fn, opts]) => useEffect(fn, opts));
            } finally {
              mountEffects = prevMountEffects;
            }
          },
        ),
      )[1];
    }

    disconnectedCallback(): void {
      this[componentSym]._destroy?.();
    }

    attributeChangedCallback(
      name: string,
      _: string | null,
      value: string | null,
    ): void {
      const prop = attributePropMap.get(name);

      if (prop) {
        this[prop.name as keyof this] =
          value != null
            ? prop.meta.attribute.transform.call(this, value)
            : isContext(prop.meta._defaultOrContext)
              ? undefined
              : prop.meta._defaultOrContext;
      }
    }

    abstract render(): Template;
  }

  return _Component as any;
}) as any;

/**
 * Determines whether the given value is a component created by
 * extending {@link ComponentConstructor}.
 */
export const isComponent = (
  value: any,
): value is ComponentConstructor | Component => !!value?.[componentSym];

/**
 * Represents a functional component.
 *
 * @example
 * ```tsx
 * const MyComponent: FunctionalComponent<{
 *   name: MaybeSignal<string>;
 * }> = ({ name }) => {
 *   return <h1>Hello, {name}!</h1>;
 * };
 * ```
 */
export interface FunctionalComponent<in P extends object = {}> {
  (props: P): Template;
}

/**
 * Defines a set of components with the given prefix.
 */
export const defineComponents: ((
  ...components: ComponentConstructor[]
) => void) &
  ((prefix: string, ...components: ComponentConstructor[]) => void) = (
  ...args: [string | ComponentConstructor, ...ComponentConstructor[]]
) => {
  const [prefix, components] =
    typeof args[0] == "string"
      ? [args[0], args.slice(1) as ComponentConstructor[]]
      : ["", args as ComponentConstructor[]];

  for (const component of components) {
    customElements.define(prefix + component[componentSym]._tagName, component);
  }
};
