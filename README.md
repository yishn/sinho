# 🚥 Shingō

A lightweight signal-based library for building web components with a React-like
API.

- 🌌 Web standards
- 🛟 Type-safe components
- ✒️ Declarative templating with JSX
- 🚥 Fine-granular reactivity
- 🪶 Lightweight (~4KB minified and compressed)

```tsx
class Counter extends Component() {
  static tagName = "x-counter";

  render() {
    const [value, setValue] = useSignal(0);

    return (
      <>
        <p>Counter: {value}</p>
        <p>
          <button onclick={() => setValue((n) => n + 1)}>Increment</button>
          <button onclick={() => setValue((n) => n - 1)}>Decrement</button>
        </p>
      </>
    );
  }
}

defineComponents(Counter);

document.body.append(new Counter());
```

## Guide

### Installation

Use npm to install Shingō:

```
npm install shingo
```

Shingō works out of the box with TypeScript. To use JSX, you can use the
following `tsconfig.json` options:

```json
{
  "compilerOptions": {
    "moduleResolution": "NodeNext",
    "jsx": "react-jsx",
    "jsxImportSource": "shingo"
    // …
  }
  // …
}
```

If you do not use TypeScript, you need to transform JSX, e.g. with Babel and
[@babel/plugin-transform-react-jsx](https:abeljs.io/docs/babel-plugin-transform-react-jsx):

```json
{
  "plugins": [
    [
      "@babel/plugin-transform-react-jsx",
      {
        "runtime": "automatic",
        "importSource": "shingo"
      }
    ]
    // …
  ]
  // …
}
```

You can also write templates using pure JavaScript.

### Components

You can use `Component` to create a base class that can be extended into a web
component.

```tsx
import { Component, prop } from "shingo";

export class SimpleGreeting extends Component({
  name: prop<string>("John"),
}) {
  static tagName = "simple-greeting";

  render() {
    return <h1>Hello, {this.props.name}!</h1>;
  }
}
```

`Greeting` is a custom HTML element and needs to be defined first before it is
constructable. The tag name is optionally given by the static `tagName`
property.

```tsx
import { defineComponents } from "shingo";

// …

defineComponents(SimpleGreeting);
```

Optionally, you can provide a prefix:

```tsx
defineComponents("my-", SimpleGreeting);
```

`Component` takes an object literal containing properties and events for the
component as first argument.

All properties can be accessed and set as actual class properties:

```tsx
const el = new SimpleGreeting();
document.body.append(el);

console.log(el.name); // Prints "John"

el.name = "Jane"; // Component will now display "Hello, Jane!"
```

For reactivity in templates, you need a signal instead. You can get the signal
version of your properties in `this.props`:

```tsx
<h1>Hello, {this.props.name}!</h1>
```

### Reactivity

### Properties

### Events

### Templates
