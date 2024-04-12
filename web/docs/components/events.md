---
sidebar_position: 3
---

# Events

## Define Events

You can define events on your component next to its properties by using the
`event` function.

:::warning

Event names must start with `on` and follow camelCase convention.

:::

```ts
class TaskListItem extends Component("task-list-item", {
  text: prop<string>(""),
  completed: prop<boolean>(false),
  // highlight-next-line
  onCompletedChange: event<{ completed: boolean }>(),
}) {
  // …
}
```

By default a `CustomEvent` will be created for dispatch. You can also specify a
different event constructor, either your own or another native event
constructor. Shingō expects the first constructor argument to be the event name
and the second argument to be the event details that is passed to the event
emitter:

```ts
class CompletedChangeEvent extends Event {
  detail: { completed: boolean };

  constructor(name: string, completed: boolean) {
    super(name);

    this.detail.completed = completed;
  }
}

class TaskListItem extends Component("task-list-item", {
  text: prop<string>(""),
  completed: prop<boolean>(false),
  // highlight-next-line
  onCompletedChange: event(CompletedChangeEvent),
}) {
  // …
}
```

## Dispatch Events

To emit an event you can call the corresponding method in `this.events`:

```tsx
class TaskListItem extends Component("task-list-item", {
  text: prop<string>(""),
  completed: prop<boolean>(false),
  onCompletedChange: event<{ completed: boolean }>(),
}) {
  render() {
    return (
      <>
        <input
          type="checkbox"
          checked={this.props.completed}
          onchange={(evt) => {
            // highlight-start
            this.events.onCompletedChange({
              details: {
                completed: !evt.currentTarget.checked,
              },
            });
            // highlight-end
          }}
        />
        {/* … */}
      </>
    );
  }
}
```

When a different event constructor is used, the event details are passed as
second constructor argument:

```tsx
class CompletedChangeEvent extends Event {
  detail: { completed: boolean };

  constructor(name: string, completed: boolean) {
    super(name);

    this.detail.completed = completed;
  }
}

class TaskListItem extends Component("task-list-item", {
  text: prop<string>(""),
  completed: prop<boolean>(false),
  onCompletedChange: event(CompletedChangeEvent),
}) {
  render() {
    return (
      <>
        <input
          type="checkbox"
          checked={this.props.completed}
          onchange={(evt) => {
            // highlight-next-line
            this.events.onCompletedChange(!evt.currentTarget.checked);
          }}
        />
        {/* … */}
      </>
    );
  }
}
```

The emitter function `this.events.onCompletedChange` will return `false` if the
event is cancelable and at least one of the event listeners called
`evt.preventDefault()`, otherwise `true`.

## Listen to Events

### In JS

Events can be listened to on the outside by using the `addEventListener` method:

```ts
const el = new TaskListItem();

el.addEventListener("completed-change", (evt) => {
  console.log(evt.detail.completed);
});
```

Note that the native event name is the kebab-case version without the `on`
prefix of the name defined in the component, e.g. `onCompletedChange` will be
assigned to `completed-change`.

### In JSX

In JSX templates, you can specify event listeners as attributes:

```tsx
<TaskListItem
  onCompletedChange={(evt) => {
    console.log(evt.detail.completed);
  }}
/>
```
