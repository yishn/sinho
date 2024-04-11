---
sidebar_position: 1
---

# Signals

## Create Signals

Signals are the core primitives of Shingō's reactive system. They are
responsible for managing data and triggering effects, in particular DOM updates.
You can use `useSignal()` to create a signal and its setter:

```ts
const [value, setValue] = useSignal(0);
```

## Access Signals

### In JS

You can call the signal like a function to get the value:

```ts
console.log(value()); // Prints 0
```

### In JSX

In JSX templates, you can put signals as attributes:

```tsx
class App extends Component("x-app") {
  render() {
    const [name, setName] = useSignal("John");

    // This will be reactive:
    return <SimpleGreeting name={name} />;
  }
}
```

Now if you update the signal via `setName`, the corresponding property on the
`SimpleGreeting` component will automatically updated as well.

:::warning

If you evaluate signals in an attribute, it will be considered a static value.
To make it reactive, you need to use the signal directly.

```tsx
class App extends Component("x-app") {
  render() {
    const [name, setName] = useSignal("John");

    // This will not be reactive:
    return <SimpleGreeting name={name()} />;
  }
}
```

:::

## Update Signals

You can update a signal through its setter:

```ts
const [value, setValue] = useSignal(0);

setValue(1); // Signal will now be 1
```

Alternatively, you can pass a function to the setter to update the signal based
on its previous value:

```ts
setValue((value) => value + 1);
```

By default, setters will compare the new value with the old value using `===`.
If the value did not change, the signal will not trigger any effects.

Sometimes, you may want to trigger effects even if the value did not change,
e.g. when dealing with in-place object mutations. You can do this by setting the
`force` option to `true`:

```ts
setValue(1, { force: true });
```

## Derive Signals

### Computed Signals

You can derive a computed signal from other signals by simply creating a
function:

```tsx
class App extends Component("x-app") {
  render() {
    const [gender, setGender] = useSignal("nonbinary");
    const name = () => (gender() == "female" ? "Jane" : "Charlie");
    // `name` is a computed signal and is of type `SignalLike<string>`

    // This will be reactive:
    return <SimpleGreeting name={name} />;
  }
}
```

Now the `name` property will change whenever the `gender` signal changes.

### Memoized Signals

To avoid unnecessary recomputations, you can use `useMemo`:

```tsx
import { Component, useSignal, useMemo } from "shingo";

class App extends Component("x-app") {
  render() {
    const [gender, setGender] = useSignal("nonbinary");
    const name = useMemo(() => (gender() == "female" ? "Jane" : "Charlie"));

    // `name` will only be computed once:
    return (
      <>
        <SimpleGreeting name={name} />
        <SimpleGreeting name={name} />
      </>
    );
  }
}
```
