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

## Data Binding

You can render dynamic data by using `{}` around a signal or expression:

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

## Custom Element Nodes

In addition to native HTML tags, you can also use the custom element class as
nodes, even those that are not written with Shingō:

```tsx
<SimpleGreeting name="John" />
```

:::warning

Custom elements need to be defined first before they can be rendered.

:::

## JSX Attributes

### Properties vs. Attributes

For HTML tags, Shingō will use a heuristic to determine if a JSX attribute is a
property or an HTML attribute. You can force using an attribute by using the
`attr:` prefix for the JSX attribute name, and force using a property by using
the `prop:` prefix.

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
  {/* highlight-next-line */}
  onclick={() => console.log("Clicked!")}
/>
```

Shingō will convert the event name into kebab-case. Since native events usually
do not include `-`, they will be written in lowercase. For events with unusual
names, you can use the `on:` prefix followed by the event name:

```tsx
<div
  {/* highlight-next-line */}
  on:DOMContentLoaded={() => console.log("Loaded")}
/>
```

## Web Component Nodes

## Get Reference to DOM Element

## Set HTML Content
