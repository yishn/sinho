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

### Reactivity

### Properties

### Events

### Templates
