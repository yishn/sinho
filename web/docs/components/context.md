---
sidebar_position: 4
---

# Context

## Create Context

Context provides a way to pass data through the component tree without having to
pass the property down manually at every level. It is designed to share data
that can be considered "global" for a tree of components.

First, you need to create a context object using `createContext` that identifies
your context and can be accessed by the components that need it:

```ts
import { createContext } from "sinho";

const ThemeContext = createContext("light");
```

You can also pass an default value to the context, which will be used if it is
not overwritten in the component tree.

## Provide Context

To provide the context to the children of a component, you need to define a
property on a component with the context object:

```ts
class ThemedPanel extends Component("themed-panel", {
  // highlight-next-line
  theme: prop(ThemeContext),
}) {
  render() {
    // …
  }
}
```

Now you can provide the context to the children by setting the property:

```tsx
<ThemedPanel theme="dark">
  {/*
    All children will get "dark" as context value, unless another component
    overrides it.
  */}
</ThemedPanel>
```

:::warning

The property `theme` does not contain the context value itself, but only
contains a value when an override value is set. If no override value is set, the
property will not contain the context value, but `undefined`.

```ts
const el = new ThemedPanel();
console.log(el.theme);

// Prints "undefined" even though children will get the default value "light"
// as context value.
```

:::

## Consume Context

To consume the context in a component, you can use the `useContext` function:

```tsx
import { Component, useContext } from "sinho";

class ThemedButton extends Component("themed-button", {
  // …
}) {
  render() {
    // highlight-next-line
    const theme = useContext(ThemeContext);
    // `theme` is of type `Signal<string>`

    return (
      <button
        style={{
          backgroundColor: () => (theme() == "dark" ? "black" : "white"),
          color: () => (theme() == "dark" ? "white" : "black"),
        }}
      >
        {this.props.name}
      </button>
    );
  }
}
```

:::note

It's also possible for a component to be both a provider and a consumer of a
context at the same time.

:::
