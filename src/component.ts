import {
  Cleanup,
  MaybeSignal,
  Signal,
  useEffect,
  useSubscope,
} from "./scope.js";
import type { DomProps } from "./dom.js";
import { runWithRenderer, Template } from "./renderer.js";
import { hydrateElement } from "./intrinsic/TagComponent.js";
import { Fragment } from "./intrinsic/Fragment.js";
import { Ref, useRef } from "./ref.js";
import {
  camelCaseToKebabCase,
  JsxPropNameToEventName,
  jsxPropNameToEventName,
} from "./utils.js";
import { useScope } from "./scope.js";

interface Tagged<in out T> {
  _tag: T;
}

type OmitNever<T> = Omit<
  T,
  { [K in keyof T]: T[K] extends never ? K : never }[keyof T]
>;

/** @ignore */
export interface PropMeta<T> extends PropOptions<T>, Tagged<"prop"> {
  _type?: [T];
  _init: T;
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
  transform: (value: string | null) => T;
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
    | ((value: string | null) => T)
    | (string | null extends T
        ? boolean | PartialPartial<AttributeOptions<T>, "transform">
        : AttributeOptions<T>);
}

type Props<M> = OmitNever<{
  readonly [K in keyof M]: M[K] extends PropMeta<infer T> ? Ref<T> : never;
}>;

export type EventConstructor<T = any> = new (name: string, arg: T) => Event;

/** @ignore */
export interface EventMeta<out E extends EventConstructor>
  extends Tagged<"event"> {
  _event: () => E;
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

export type JsxProps<M> = Partial<
  OmitNever<{
    [K in keyof Props<M>]: Props<M>[K] extends Signal<infer T>
      ? MaybeSignal<T>
      : never;
  }> & {
    [K in keyof Events<M>]: (evt: InstanceType<Events<M>[K]>) => void;
  } & {
    [K in keyof HTMLElementEventMap as `on${Lowercase<K>}`]: (
      evt: HTMLElementEventMap[K],
    ) => void;
  }
> &
  Omit<DomProps<any>, "children"> &
  (M extends { children: true }
    ? Pick<DomProps<any>, "children" | "dangerouslySetInnerHTML">
    : {}) & {
    // Allow other HTMLElement attributes
    [name: string]: any;
  };

type EventEmitters<M> = OmitNever<
  Omit<
    {
      [K in keyof Events<M>]: Events<M>[K] extends EventConstructor<infer E>
        ? undefined extends E
          ? (arg?: E) => void
          : (arg: E) => void
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
 * You can get and set properties by accessing the {@link Signal} or {@link Ref}
 * in `this.props`. It's also possible to set the properties directly on the
 * component instance.
 *
 * It's also possible to define an attribute for the property by setting the
 * `attribute` option. By default, the attribute name is the kebab-case version
 * of the property name. The attribute will be observed and the signal updated
 * on changes. You can also provide a custom name and a transform function to
 * convert the attribute value to the property value.
 *
 * @example
 * ```tsx
 * class App extends Component({
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
 * const app = new App();
 * app.greetingMessage = "Hello, universe!";
 * ```
 */
export const prop: (<T>(initValue: T, opts?: PropOptions<T>) => PropMeta<T>) &
  (<T>(initValue?: T, opts?: PropOptions<T | null>) => PropMeta<T | null>) = <
  T,
>(
  initValue: T | null = null,
  opts?: PropOptions<T>,
): PropMeta<any> => ({
  _tag: "prop",
  _init: initValue,
  ...opts,
});

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
 * class App extends Component({
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
 * class App extends Component({
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
export const event: (() => EventMeta<typeof CustomEvent<undefined>>) &
  (<T>() => EventMeta<typeof CustomEvent<T>>) &
  (<E extends EventConstructor>(eventConstructor: () => E) => EventMeta<E>) = ((
  eventConstructor: () => EventConstructor = () => CustomEvent,
): EventMeta<EventConstructor> => ({
  _tag: "event",
  _event: eventConstructor,
})) as any;

export type Metadata = {
  // Forbid all library properties
  [K in keyof ComponentInner<any> | "props" | "events"]?: never;
} & {
  // Forbid all dom props
  [K in Exclude<keyof DomProps<any>, "children">]?: never;
} & {
  // Forbid all native HTMLElement events
  [K in keyof HTMLElementEventMap as `on${Lowercase<K>}`]?: never;
} & {
  children?: boolean;
} & {
  [name: string]: PropMeta<any> | EventMeta<any> | boolean;
};

declare abstract class ComponentInner<M extends Metadata> {
  protected props: Props<M>;
  protected events: EventEmitters<M>;

  [_jsxPropsSym]?: JsxProps<M>;

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

const componentSym = Symbol();
/** @ignore */
export const _jsxPropsSym = Symbol();

export type Component<M extends Metadata = {}> = {
  -readonly [K in keyof Props<M>]: Props<M>[K] extends Signal<infer T>
    ? T
    : never;
} & ComponentInner<M> &
  HTMLElement;

export interface ComponentConstructor<M extends Metadata = {}> {
  /** @ignore */
  readonly [componentSym]: true;
  readonly tagName?: string;
  readonly observedAttributes: readonly string[];

  new (): Component<M>;
}

export interface ComponentOptions {
  /**
   * Shadow DOM options. Set to `false` to disable shadow DOM.
   *
   * @default { mode: "open" }
   */
  shadowDOM?: ShadowRootInit | false;
}

let mountEffects: [fn: () => Cleanup, deps?: Signal<unknown>[]][] | undefined;

/**
 * Creates the given effect only once when the component is mounted.
 *
 * If used outside of a component, this is equivalent to {@link useEffect} and
 * the effect will run immediately.
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
 * class MyComponent extends Component({
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
export const Component: (() => ComponentConstructor<{}>) &
  (<const M extends Metadata>(
    metadata: M,
    opts?: ComponentOptions,
  ) => ComponentConstructor<M>) = ((
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
    const meta = metadata[name];

    if (typeof meta == "object" && meta._tag == "prop" && meta.attribute) {
      if (typeof meta.attribute == "function") {
        meta.attribute = { transform: meta.attribute };
      } else if (meta.attribute == true) {
        meta.attribute = {};
      }

      const attribute = meta.attribute;

      meta.attribute = {
        name: camelCaseToKebabCase(name),
        static: false,
        transform: (x) => x,
        ...attribute,
      };

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

  opts.shadowDOM ??= { mode: "open" };

  const getRenderParent = (component: _Component) =>
    opts.shadowDOM
      ? component.shadowRoot ?? component.attachShadow(opts.shadowDOM)
      : !metadata.children
        ? component
        : null;

  abstract class _Component extends HTMLElement {
    static readonly [componentSym] = true;
    static readonly tagName?: string;
    static readonly observedAttributes: readonly string[] = observedAttributes;

    protected props: Record<string, Signal<any>> = {};
    protected events: Record<string, (arg: unknown) => any> = {};

    [componentSym]: {
      _scope?: ReturnType<typeof useScope>;
      _props?: JsxProps<Record<string, any> & { children: true }>;
      _eventsAttached?: boolean;
      _destroy?: () => void;
    } = {};

    get [_jsxPropsSym]() {
      return this[componentSym]._props;
    }

    set [_jsxPropsSym](props) {
      this[componentSym]._props = props;

      if (metadata.children) {
        while (this.firstChild) {
          this.removeChild(this.lastChild!);
        }

        this.append(
          ...runWithRenderer((renderer) => {
            renderer._nodes = this.childNodes.values();
            return Fragment({ children: props?.children }).build();
          }),
        );
      }

      // If component is already mounted

      if (this[componentSym]._scope) {
        this[componentSym]._destroy?.();
        delete this[componentSym]._destroy;
        delete this[componentSym]._scope;

        this[componentSym]._eventsAttached = false;
        this.connectedCallback();
      }
    }

    constructor() {
      super();

      for (const name in metadata) {
        const meta = metadata[name];

        if (typeof meta == "boolean") {
          // Do nothing
        } else if (meta._tag == "prop") {
          const defaultValue = meta._init;
          const ref = useRef<unknown>(defaultValue);

          this.props[name] = ref;

          Object.defineProperty(this, name, {
            get() {
              return this.props[name].peek();
            },
            set(value) {
              ref.set(() => value, { force: true });
            },
          });
        } else if (meta._tag == "event" && name.startsWith("on")) {
          const eventName = jsxPropNameToEventName(name as `on${string}`);

          this.events[name] = (arg: unknown) => {
            this.dispatchEvent(new (meta._event())(eventName, arg));
          };
        }
      }
    }

    connectedCallback(): void {
      // Set properties from attributes

      for (const [attrName, prop] of attributePropMap.entries()) {
        this[prop.name as keyof this] = prop.meta.attribute.transform(
          this.getAttribute(attrName),
        );
      }

      const props = { ...this[_jsxPropsSym] };

      this[componentSym]._destroy = useSubscope(() => {
        this[componentSym]._scope = useScope();

        for (const name in this.props) {
          // Make properties reactive

          if (name in props) {
            const maybeSignal = props[name];

            useEffect(() => {
              this[name as keyof this] = MaybeSignal.get<any>(maybeSignal);
            });
          }

          delete props[name];
        }

        // Render

        const prevMountEffects = mountEffects;
        mountEffects = [];

        try {
          const renderParent = getRenderParent(this);

          renderParent?.append(
            ...runWithRenderer((renderer) => {
              renderer._nodes = renderParent.childNodes.values();
              return this.render().build();
            }),
          );

          // Don't attach event handlers if already attached

          if (this[componentSym]._eventsAttached) {
            for (const name in this.events) {
              delete props[name];
            }
          }

          const ref = props.ref;
          delete props.ref;

          // Set other props

          hydrateElement(this, props);

          // Set ref

          ref?.set(this);

          // Run mount effects

          for (const [fn, opts] of mountEffects) {
            useEffect(fn, opts);
          }
        } finally {
          mountEffects = prevMountEffects;

          this[componentSym]._eventsAttached = true;
        }
      });
    }

    disconnectedCallback(): void {
      this[_jsxPropsSym]?.ref?.set(undefined);

      this[componentSym]._destroy?.();
      delete this[componentSym]._destroy;
      delete this[componentSym]._scope;

      const host = getRenderParent(this);

      while (host?.firstChild) {
        host.removeChild(host.lastChild!);
      }
    }

    attributeChangedCallback(
      name: string,
      _: string | null,
      value: string | null,
    ): void {
      const prop = attributePropMap.get(name);

      if (prop) {
        this[prop.name as keyof this] = prop.meta.attribute.transform(value);
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
): value is ComponentConstructor | Component => !!(value as any)[componentSym];

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
    customElements.define(
      prefix + component.tagName ?? crypto.randomUUID(),
      component,
    );
  }
};
