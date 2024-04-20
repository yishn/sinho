---
sidebar_position: 4
---

# Portal

## Basics

The `Portal` component allows you to render a component at a different location
in the DOM tree. This is useful when you need to render a component outside of
its parent component, for example, when you need to render a modal or a tooltip.

Use the `mount` prop to specify the target DOM element where the component
should be rendered:

```tsx
import { Portal } from "shingo";

// …

return (
  <>
    <h1>Hello World!</h1>

    {/* highlight-start */}
    <Portal mount={document.getElementById("modal")!}>
      <div>Modal content</div>
    </Portal>
    {/* highlight-end */}
  </>
);
```

:::note

Since the children of the `Portal` component are rendered outside of the
component tree, certain features such as event bubbling and context providers
work in the context of the target DOM element instead.

:::
