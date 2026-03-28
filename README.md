# 🚥 Sinho

A lightweight signal-based library for building web components with a React-like
API.

- 🌌 Web standards with custom HTML elements
- ⚛️ React-like API
- ✒️ Declarative templating with JSX (no additional parsing)
- 🚥 Fine-grained reactivity with signals
- 🛟 Type-safe components with TypeScript
- 🪶 Lightweight (~4KB minified and compressed)

```tsx
import { Component, useSignal, defineComponents } from "sinho";

class MyCounter extends Component() {
  render() {
    const [value, setValue] = useSignal(0);

    return (
      <>
        <p>Counter: {value}</p>
        <p>
          <button onclick={() => setValue((n) => n + 1)}>Increment</button>{" "}
          <button onclick={() => setValue((n) => n - 1)}>Decrement</button>
        </p>
      </>
    );
  }
}

defineComponents(MyCounter);
```
