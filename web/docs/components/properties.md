---
sidebar_position: 2
---

# Properties

## Define Properties

`Component` takes an object literal containing properties and events for the
component as second argument. Use the `prop` function to define properties and
optionally pass a default value:

```tsx
Component("simple-greeting", {
  name: prop<string>("John"),
});
```

If you do not pass a default value, the property is `undefined` by default.

:::warning

Property names must not start with `on` as that prefix is reserved for events.

:::

:::danger

Property name must not collide with existing `HTMLElement` properties to avoid
unexpected behavior.

:::

Note that none of the properties are required to be set when constructing the
component.

## Access Properties

### In JS

All properties can be accessed as actual class properties from the outside:

```ts
const el = new SimpleGreeting();
document.body.append(el);

console.log(el.name); // Prints default value "John"

el.name = "Jane"; // Component will now display "Hello, Jane!"
console.log(el.name); // Prints "Jane"
```

### In JSX

For reactivity in JSX templates, you need signals instead. You can get the
signals of your properties in `this.props`:

```tsx
<h1>Hello, {this.props.name}!</h1>
```

## Set Properties

### In JS

With a class instance, you can set properties directly:

```ts
const el = new SimpleGreeting();
document.body.append(el);

el.name = "Jane"; // Component will now display "Hello, Jane!"
```

These changes will be propagated through its corresponding signal
`this.props.name`.

:::tip

It is generally discouraged to change properties from the inside of the
component as it breaks the unidirectional data flow. Instead, you should use
events to propagate changes upward.

:::

### In JSX

Inside a JSX template, you can use JSX attributes to set properties, either
using a static variable or a signal:

```tsx
<SimpleGreeting name="John" />;
<SimpleGreeting name={this.props.name} />;
```

## Attribute Association

### Define Attributes

You can associate attributes with props by providing the `attribute` option of a
prop:

```tsx
Component("simple-greeting", {
  name: prop<string>("John", {
    attribute: {
      // …
    },
  }),
});

// In HTML:

<simple-greeting name="Jane"></simple-greeting>;
```

By default all attribute changes will be propagated to the properties. If the
corresponding attribute is not set on the element, the property will revert to
the default value.

However, property changes will not be propagated back to attributes. You can
stop propagation by setting the `static` option to `true`:

```ts
Component("simple-greeting", {
  name: prop<string>("John", {
    attribute: {
      static: true,
    },
  }),
});
```

The attribute name will be the kebab-case version of the property name, e.g. a
property named `myName` will be assigned the attribute name `my-name`. It's also
possible to specify a custom attribute name:

```tsx
Component("simple-greeting", {
  name: prop<string>("John", {
    attribute: {
      name: "attr-name",
    },
  }),
});

// In HTML:

<simple-greeting attr-name="Jane"></simple-greeting>;
```

:::danger

Attribute names must not collide with existing `HTMLElement` attributes to avoid
unexpected behavior.

:::

The `transform` option can be used to transform attribute values when they are
propagated to the property. This option is necessary if property type is not a
string.

```tsx
Component("simple-greeting", {
  name: prop<string>("John", {
    attribute: {
      transform: (value) => value.toUpperCase(),
    },
  }),
});

// In HTML:

<simple-greeting name="Jane"></simple-greeting>;
// Property `name` will be "JANE"
```

You can also use the shorthand notation:

```tsx
Component("simple-greeting", {
  name: prop<string>("John", {
    attribute: (value) => value.toUpperCase(),
  }),
});
```

### String Attributes

For string attributes, you can simply set the `attribute` option to `String` as
a shorthand notation:

```tsx
Component("simple-greeting", {
  name: prop<string>("John", {
    attribute: String,
  }),
});

// In HTML:

<simple-greeting name="Jane"></simple-greeting>;
// Property `name` will be "Jane"
```

### Number Attributes

For number attributes, you can set the `attribute` option to `Number`:

```tsx
Component("simple-greeting", {
  age: prop<number>(18, {
    attribute: Number,
  }),
});

// In HTML:

<simple-greeting age="21"></simple-greeting>;
// Property `age` will be 21
```

### Boolean Attributes

For boolean attributes, it is recommended to set the default property value to
`false` and to set `transform` to `(value) => true`:

```tsx
Component("simple-greeting", {
  active: prop<boolean>(false, {
    attribute: () => true,
  }),
});

// In HTML:

<simple-greeting></simple-greeting>;
// Property `active` will be false
<simple-greeting active></simple-greeting>;
// Property `active` will be true
<simple-greeting active=""></simple-greeting>;
// Property `active` will be true
<simple-greeting active="false"></simple-greeting>;
// Property `active` will be true
```

:::note

This is counterintuitive, but this behavior is consistent with boolean
attributes of standard HTML elements.

:::

## Children

When using shadow DOM, you can allow light DOM children from the outside in your
component by setting the `children` option to `true`:

```tsx
Component("simple-greeting", {
  children: true,
});
```

This allows techniques like slotting:

```tsx
class SimpleGreetings extends Component("simple-greetings", {
  children: true,
}) {
  render() {
    return (
      <>
        Hello, <slot>John</slot>
      </>
    );
  }
}
```

The following will print "Hello, Jane":

```html
<simple-greeting>Jane</simple-greeting>
```
