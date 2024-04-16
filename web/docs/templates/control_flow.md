---
sidebar_position: 2
---

# Control Flow

## Basics

Since Shingō templates are only created once for the whole lifetime of a
component, you can't use dynamic JavaScript expressions such as ternary
operators in the template. Instead, you can use special control flow functional
components.

## Conditionals

You can use the `<If>`/`<ElseIf>`/`<Else>` components to conditionally render
parts of the template:

```tsx
import { useSignal, If, ElseIf, Else } from "shingo";

const [count, setCount] = useSignal(0);

const template = (
  <>
    <If condition={() => count() > 0}>
      <div>My Content</div>
    </If>
    <ElseIf condition={() => count() < 0}>
      <div>Error occurred!</div>
    </ElseIf>
    <Else>
      <div>No content</div>
    </Else>
  </>
);
```

`<ElseIf>`/`<Else>` are optional and you can have as many `<ElseIf>` as you
want. `<Else>` should be the last one if it's present.

:::tip

Keep `<If>`/`<ElseIf>`/`<Else>` next to each other for easier readability and
reasonability of your code.

:::

## Loops

You can use the `<For>` component to loop over an array and render a template
for each element:

```tsx
import { useSignal, For } from "shingo";

const [colors, setColors] = useSignal(["red", "green", "blue"]);

const template = (
  <ul>
    <For each={colors}>
      {(color, index) => (
        <li style={{ backgroundColor: color }}>
          #{index}: {color}
        </li>
      )}
    </For>
  </ul>
);
```

When `colors` updates, `<For>` will compare the new array with the old one and
efficiently update the DOM.

You can additionally specify a key function to help `<For>` identify which
elements should be stable across updates. With a key function `<For>` can infer
which correct operation to perform (insert, update, or remove) for each element
across updates.

```tsx
import { useSignal, For } from "shingo";

const [tasks, setTasks] = useSignal([
  { id: 1, text: "Learn Shingō" },
  { id: 2, text: "Build an app" },
]);

const template = (
  <ul>
    <For each={tasks} key={(task) => task.id}>
      {(task, index) => (
        <li>
          #{index}: {() => task().text}
        </li>
      )}
    </For>
  </ul>
);
```

If the key function is not specified, `<For>` will use the index of the element
as the key.

:::warning

The key function must be a pure function that returns a unique value for each
element.

:::
