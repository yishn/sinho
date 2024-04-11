---
sidebar_position: 1
---

# Basics

## Create Components

You can use `Component` to create a base class that can be extended into a web
component.

```tsx
import { Component, prop } from "shingo";

export class SimpleGreeting extends Component("simple-greeting", {
  name: prop<string>("John"),
}) {
  render() {
    return <h1>Hello, {this.props.name}!</h1>;
  }
}
```

The class needs to provide a `render` method that returns a JSX template.

`SimpleGreeting` is now a custom HTML element and needs to be defined first
before it can be used or constructed. You can use the `defineComponents`
function to define it with the tag name given as first argument to `Component`:

```tsx
import { defineComponents } from "shingo";

// …

defineComponents(SimpleGreeting);
```

Optionally, you can provide a prefix:

```tsx
defineComponents("my-", SimpleGreeting);
```

You can define multiple components at once:

```tsx
defineComponents(SimpleGreeting, AnotherComponent);
```

```tsx
defineComponents("my-", SimpleGreeting, AnotherComponent);
```

## Usage

### In HTML

You can specify the component in HTML via its tag name:

```html
<simple-greeting></simple-greeting>
```

If a prefix (e.g. `my-`) was provided, you need to use it:

```html
<my-simple-greeting></my-simple-greeting>
```

:::warning

Notice the mandatory closing tag. Custom elements cannot be self-closing.

:::

### In JS

You can construct the component in JavaScript like a normal class:

```ts
const greeting = new SimpleGreeting();
greeting.name = "Jane";
```

### In JSX

You can use the component directly in Shingō JSX templates:

```tsx
<SimpleGreeting name="Jane" />
```

:::warning

You can only use class components in JSX templates if the component has been
created with the same Shingō version. Otherwise, you need to use the HTML syntax
inside the JSX:

```tsx
<simple-greeting></simple-greeting>
```

:::

## Shadow DOM

By default, Shingō renders the template returned by `render()` into the
[shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM).
This will provide encapsulation and slotting. If this is not desired, you can
disable this by setting the `shadow` option on your component to `false`:

```tsx
export class SimpleGreeting extends Component(
  "simple-greeting",
  { name: prop<string>("John") },
  { shadow: false }
) {
  // …
}
```

If you disable shadow DOM, the template will be rendered into the light DOM and
techniques such as slotting will not work.