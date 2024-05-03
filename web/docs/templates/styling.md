---
sidebar_position: 3
---

# Styling

## Inline Styles

You can use inline styles to style your components with the `style` JSX
attribute on a native HTML tag or custom element. Inline styles are defined as a
object where the keys are camelCased versions of the CSS property names, and the
values are the CSS property values or signals thereof.

```tsx
const [color, setColor] = useSignal("red");

return (
  <h1
    // highlight-start
    style={{
      color,
      fontSize: 20,
    }}
    // highlight-end
  >
    Hello World!
  </h1>
);
```

It's also possible to define CSS custom properties in the inline styles object:

```tsx
const [color, setColor] = useSignal("red");

return (
  // highlight-next-line
  <div style={{ "--color": color }}>
    <h1
      style={{
        // highlight-next-line
        color: "var(--color)",
        fontSize: 20,
      }}
    >
      Hello World!
    </h1>
  </div>
);
```

## Component Styles

### Basics

You can use the `Style` component to include CSS stylesheets in your components.
It is recommended to use the `css` template literal tag to write CSS:

```tsx
import { Style, css } from "sinho";

// …

return (
  <>
    <h1>Hello World!</h1>

    {/* highlight-start */}
    <Style>{css`
      h1 {
        color: red;
      }
    `}</Style>
    {/* highlight-end */}
  </>
);
```

### Style Scoping

If your component renders into the shadow DOM, the CSS in `Style` will
automatically be scoped to the shadow DOM. This means that the styles will only
apply to the elements inside the shadow DOM and not to the rest of the document,
and conversely, styles from outside the shadow DOM will not apply to the
elements inside, except for inherited CSS properties such as `color`, `font*`,
and custom properties.

If you want to apply styles to the light DOM, you can use the `light` attribute
on the `Style` component:

```tsx
return (
  <>
    <h1>Hello World!</h1>

    {/* highlight-next-line */}
    <Style light>{css`
      h1 {
        color: red;
      }
    `}</Style>
  </>
);
```

In case your component renders into the light DOM, all injected styles will be
light by default.

:::warning

Light DOM styles are not scoped. Use them with caution to avoid unintended side
effects.

:::

### Dynamic Styling

It is recommended to use static styles whenever possible. Static styles will
only be compiled once by the browser and reused across all instances of the
component by using contructable stylesheets.

However, if you need to apply dynamic styles, you can use signal interpolation
in the `css` template literal tag:

```tsx
const [color, setColor] = useSignal("red");

return (
  <>
    <h1>Hello World!</h1>

    <Style>{css`
      h1 {
        /* highlight-next-line */
        color: ${color};
      }
    `}</Style>
  </>
);
```

Dynamic styles need to be compiled by the browser whenever the interpolation
signals change.

:::tip

You should prefer using CSS custom properties or classes to define different
styles using static stylesheets. If you have to use dynamic styles, try to
separate them from the static styles to avoid recompiling the static styles.

:::
