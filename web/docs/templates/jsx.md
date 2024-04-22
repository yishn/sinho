---
sidebar_position: 1
---

# JSX

## Basics

JSX is a special syntax for templates which allows you to write HTML-like code.
Each component has a `render` function that returns a JSX template.

```tsx
import { Component, prop } from "shingo";

export class HelloWorld extends Component("hello-world") {
  render() {
    return (
      // highlight-start
      <div class="hello-world">
        <h1>Hello, World!</h1>
        <p>This is a paragraph</p>
      </div>
      // highlight-end
    );
  }
}
```

In this example, the `HelloWorld` component will render a `div` element with two
children, an `h1` and a `p` element.

JSX will be transpiled into normal JavaScript. The above code is equivalent to:

```ts
import { Component, prop, h } from "shingo";

export class HelloWorld extends Component("hello-world") {
  render() {
    return (
      // highlight-start
      h("div", { class: "hello-world" }, [
        h("h1", {}, "Hello, World!"),
        h("p", {}, "This is a paragraph"),
      ])
      // highlight-end
    );
  }
}
```

For native HTML tags, you can use a shorthand notation:

```ts
import { Component, prop, h } from "shingo";

export class HelloWorld extends Component("hello-world") {
  render() {
    return (
      // highlight-start
      h.div({ class: "hello-world" }, [
        h.h1({}, "Hello, World!"),
        h.p({}, "This is a paragraph"),
      ])
      // highlight-end
    );
  }
}
```

In addition to HTML tags, you can also use a custom element class as node, even
those that are not written with Shingō:

```tsx
<HelloWorld />;
<SimpleGreeting name="John" />;

// This is equivalent to:

h(HelloWorld);
h(SimpleGreeting, { name: "John" });
```

:::warning

Custom elements need to be defined first before they can be rendered. Custom
element classes can only be used in JSX templates if they can be constructed
without arguments.

:::

## Fragments

To render multiple elements without a parent element, you can use a fragment:

```tsx
import { Component, prop } from "shingo";

export class HelloWorld extends Component("hello-world") {
  render() {
    return (
      // highlight-next-line
      <>
        <h1>Hello, World!</h1>
        <p>This is a paragraph</p>
        {/* highlight-next-line */}
      </>
    );
  }
}
```

## Data Binding

You can render dynamic data by using curly braces `{}` around a signal or
expression:

```tsx
const [className, setClassName] = useSignal("hello-world");
const [name, setName] = useSignal("John");

return (
  // highlight-start
  <div class={className}>
    <h1>Hello, {name}</h1>
    {/* highlight-end */}
    <p>This is a paragraph</p>
  </div>
);
```

This is equivalent to:

```tsx
const [className, setClassName] = useSignal("hello-world");
const [name, setName] = useSignal("John");

// highlight-start
return h.div({ class: className }, [
  h.h1({}, ["Hello, ", name]),
  // highlight-end
  h.p({}, "This is a paragraph"),
]);
```

:::warning

If you evaluate signals in templates, it will be considered a static value. To
make it reactive, you need to use signals directly.

```tsx
const [className, setClassName] = useSignal("hello-world");
const [name, setName] = useSignal("John");

// The following will **not** be reactive:

return (
  // highlight-start
  <div class={className()}>
    <h1>Hello, {name()}</h1>
    {/* highlight-end */}
    <p>This is a paragraph</p>
  </div>
);
```

:::

## JSX Attributes

### Properties vs. Attributes

For [functional components](../components/functional-components), JSX attributes
will be passed as is to the function.

For native HTML tags and custom element nodes, Shingō will use a heuristic to
determine if a JSX attribute is a property or an HTML attribute.

You can force using an attribute by using the `attr:` prefix for the JSX
attribute name, and force using a property by using the `prop:` prefix.

```tsx
return (
  <input
    // highlight-start
    attr:type="text"
    prop:value={name}
    // highlight-end
  />
);
```

### Events

You can attach event listeners to elements by using the `on` prefix followed by
the event name in camelCase:

```tsx
<button
  // highlight-next-line
  onclick={() => console.log("Clicked!")}
/>;

// Equivalent to:

buttonEl.addEventListener("click", () => console.log("Clicked!"));
```

```tsx
<SimpleGreeting
  // highlight-next-line
  onNameChange={() => console.log("Name changed!")}
/>;

// Equivalent to:

simpleGreeting.addEventListener("name-change", () => console.log("Clicked!"));
```

Shingō will convert the event name into kebab-case. Since native events usually
do not include `-`, they will be written in lowercase. For events with unusual
names, you can use the `on:` prefix followed by the verbatim event name:

```tsx
<SimpleGreeting
  // highlight-next-line
  on:name-change={() => console.log("Name changed!")}
/>
```

```tsx
<div
  // highlight-next-line
  on:DOMContentLoaded={() => console.log("Loaded")}
/>;

// Equivalent to:

divEl.addEventListener("DOMContentLoaded", () => console.log("Loaded"));
```

## Get Reference to DOM Element

You can get a reference to the underlying DOM element of a custom element or
HTML tag by using `useRef` and attaching it to the `ref` attribute:

```tsx
const inputRef = useRef<HTMLInputElement>();

return (
  <input
    // highlight-next-line
    ref={inputRef}
  />
);
```

In this example, `inputRef` is a signal that will hold the reference to the
`input` element or `null` if the element is not (yet) rendered. The following
effect will focus the input element whenever it is mounted:

```tsx
useEffect(() => {
  if (inputRef()) {
    inputRef()!.focus();
  }
});
```

:::note

Functional components do not have an underlying DOM element, so you cannot use
`ref` on them.

:::

## Set HTML Content

Shingō will generally render text children not as HTML but as plain text to
prevent XSS attacks. If you want to render HTML content, you can use the
`dangerouslySetInnerHTML` attribute:

```tsx
import { DangerousHtml } from "shingo";

// highlight-next-line
const htmlContent: DangerousHtml = { __html: "<b>This is bold</b>" };

return (
  <div
    // highlight-next-line
    dangerouslySetInnerHTML={htmlContent}
  />
);
```

:::danger

If you use `dangerouslySetInnerHTML`, make sure that the content is safe and
user input is sanitized. Otherwise, it can lead to XSS attacks.

:::
