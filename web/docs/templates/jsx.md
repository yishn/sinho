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

In addition to native HTML tags, you can also use a custom element class as
nodes, even those that are not written with Shingō:

```tsx
<HelloWorld />
<SimpleGreeting name="John" />

// This is equivalent to:

h(HelloWorld);
h(SimpleGreeting, { name: "John" });
```

:::warning

Custom elements need to be defined first before they can be rendered.

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

// highlight-start
<div class={className}>
  <h1>Hello, {name}</h1>
  {/* highlight-end */}
  <p>This is a paragraph</p>
</div>;
```

This is equivalent to:

```tsx
const [className, setClassName] = useSignal("hello-world");
const [name, setName] = useSignal("John");

// highlight-start
h.div({ class: className }, [
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

// highlight-start
<div class={className()}>
  <h1>Hello, {name()}</h1>
  {/* highlight-end */}
  <p>This is a paragraph</p>
</div>;
```

:::

## JSX Attributes

### Properties vs. Attributes

For [functional components](../components/functional-components), JSX attributes
will be passed as is to the function.

For custom element nodes, Shingō will automatically map JSX attributes to
properties of the element.

For other HTML tags, Shingō will use a heuristic to determine if a JSX attribute
is a property or an HTML attribute.

In the last two cases, you can force using an attribute by using the `attr:`
prefix for the JSX attribute name, and force using a property by using the
`prop:` prefix.

```tsx
<input
  // highlight-start
  attr:type="text"
  prop:value={name}
  // highlight-end
/>
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

## Set HTML Content
