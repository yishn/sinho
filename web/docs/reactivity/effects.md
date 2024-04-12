---
sidebar_position: 2
---

# Effects

## Create Effects

Effects are functions that are executed when a signal changes. You can use
`useEffect()` to create an effect:

```ts
import { useSignal, useEffect } from "shingo";

const [value, setValue] = useSignal(0);

useEffect(() => {
  console.log(value());
});
```

Inside of components, the function is first called when the component mounts,
otherwise it is called immediately on creation.

The effect can track all its accessed signals and will be re-executed whenever
one of them changes, in this case `value`.

## Manage Dependencies

You can also specify dependencies manually by specifying an array of
dependencies as the second argument of `useEffect`:

```ts
const [name, setName] = useSignal("Jane");
const [gender, setGender] = useSignal("female");

useEffect(() => {
  console.log(name(), gender());
  // highlight-next-line
}, [name]);
```

In this example, the effect will only be re-executed when `name` changes. You
can also use `signal.peek()` to access the value of a signal without tracking,
so the sample above is equivalent to:

```ts
useEffect(() => {
  console.log(name(), gender.peek());
});
```

:::warning

Computed signals are not supported as dependencies since they are just normal
functions. You can use `useMemo` to turn a computed signal into a memoized
signal.

:::

## Clean Up Effects

It is possible to return a cleanup function that will be run when the effect is
re-executed or destroyed:

```ts
useEffect(() => {
  console.log("Hello ", name());

  // highlight-start
  return () => {
    console.log("Goodbye ", name());
  };
  // highlight-end
});
```

In this case, whenever `name` is about to change, the cleanup function will be
executed first.

## Batching Updates

Say, we have an effect which depends on multiple signals:

```ts
const [name, setName] = useSignal("Jane");
const [gender, setGender] = useSignal("female");

useEffect(() => {
  console.log(name(), gender());
});
```

If both signals change independently, the effect will be executed twice:

```ts
setName("John");
// Effect will print "John female"
setGender("male");
// Effect will print "John male"
```

To avoid this, you can batch updates using `useBatch`:

```ts
import { useBatch } from "shingo";

useBatch(() => {
  setName("John");
  setGender("male");
});
// Effect will print "John male"
```

This way, the effect will only be executed once after all signals have changed.

In fact, all updates to signals inside of effects and event listeners will be
batched by default. This is to prevent unnecessary re-renders and to improve
performance, but also to ensure that all signals are in a consistent state when
the effect is executed.

To manually ensure the effects are executed immediately inside an effect or
event listener, you can also use `useBatch`:

```ts
useEffect(() => {
  useBatch(() => {
    setName("Charlie");
    setGender("nonbinary");
  }); // When `useBatch` is called, effect executions will be triggered

  console.log(name(), gender()); // Prints "Charlie nonbinary"
});
```
