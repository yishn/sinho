---
sidebar_position: 4
---

# Functional Components

## Basics

Functional components are different from class components in that they do not
extend a base class. Instead, they are just functions that take an object of
props and return a template.

```tsx
import { FunctionalComponent, MaybeSignal } from "shingo";

export const FunctionalGreeting: FunctionalComponent<{
  name: MaybeSignal<string>;
}> = (props) => {
  return <h1>Hello, {props.name}!</h1>;
};
```

They can be used in JSX like this, where attributes are passed as props:

```tsx
<FunctionalGreeting name="John" />
```

:::warning

Note that functional components are not custom elements, therefore do not create
a DOM element by themselves. Also, they do not have shadow DOM or scoped styles,
and can only be used in JSX templates.

:::

## Children

You can specify children in functional components by using the `children` prop:

```tsx
import { FunctionalComponent, MaybeSignal, Children } from "shingo";

export const FunctionalGreeting: FunctionalComponent<{
  name: MaybeSignal<string>;
  // highlight-next-line
  children: Children;
}> = (props) => {
  return (
    <div>
      <h1>Hello, {props.name}!</h1>
      {/* highlight-next-line */}
      {props.children}
    </div>
  );
};
```

```tsx
<FunctionalGreeting name="John">
  {/* highlight-next-line */}
  <p>This is a paragraph</p>
</FunctionalGreeting>
```
