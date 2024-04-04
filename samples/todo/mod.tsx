import {
  Component,
  defineComponents,
  event,
  For,
  If,
  prop,
  useSignal,
} from "shingo";

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

class TaskList extends Component("task-list", {
  children: true,
  onTaskItemAdd: event<{
    text: string;
  }>(),
}) {
  render() {
    const [newTaskText, setNewTaskText] = useSignal("");

    return (
      <>
        <p>
          <form
            onsubmit={(evt) => {
              evt.preventDefault();
              if (newTaskText() == "") return;

              setNewTaskText("");
              this.events.onTaskItemAdd({
                detail: {
                  text: newTaskText(),
                },
              });
            }}
          >
            <input
              type="text"
              autofocus
              value={newTaskText}
              oninput={(evt) => {
                setNewTaskText(evt.currentTarget.value);
              }}
            />{" "}
            <button type="submit">Add</button>
          </form>
        </p>

        <ul>
          <slot></slot>
        </ul>
      </>
    );
  }
}

class TaskItem extends Component("task-item", {
  completed: prop<boolean>(false, {
    attribute: () => true,
  }),
  children: true,
  onTaskItemCompletedChange: event<boolean>(),
  onTaskItemDelete: event(MouseEvent),
}) {
  render() {
    return (
      <>
        <label>
          <input
            type="checkbox"
            checked={this.props.completed}
            onclick={() => {
              this.events.onTaskItemCompletedChange({
                detail: !this.props.completed(),
              });
            }}
          />{" "}
          <button onclick={(evt) => this.events.onTaskItemDelete(evt)}>
            Delete
          </button>{" "}
          <If
            condition={this.props.completed}
            then={
              <del>
                <slot />
              </del>
            }
            else={<slot />}
          />
        </label>
      </>
    );
  }
}

class App extends Component("app-component", {}, { shadow: false }) {
  render() {
    const [tasks, setTasks] = useSignal<Task[]>([
      {
        id: 0,
        text: "Learn about Web Components",
        completed: false,
      },
    ]);

    return (
      <>
        <p>
          <button
            onclick={() => {
              setTasks((tasks) => tasks.filter((task) => !task.completed));
            }}
          >
            Delete Completed
          </button>{" "}
          <button
            onclick={() => {
              setTasks((tasks) =>
                [...tasks].sort((a, b) => a.text.localeCompare(b.text)),
              );
            }}
          >
            Sort
          </button>
        </p>

        <TaskList
          onTaskItemAdd={(evt) => {
            setTasks((tasks) => [
              ...tasks,
              {
                id: Date.now(),
                text: evt.detail.text,
                completed: false,
              },
            ]);
          }}
        >
          <For
            each={tasks}
            key={(task) => task.id}
            render={(task, i) => (
              <li>
                <TaskItem
                  completed={() => task().completed}
                  onTaskItemCompletedChange={(evt) => {
                    setTasks((tasks) => [
                      ...tasks.slice(0, i()),
                      {
                        ...tasks[i()],
                        completed: evt.detail,
                      },
                      ...tasks.slice(i() + 1),
                    ]);
                  }}
                  onTaskItemDelete={() => {
                    setTasks((tasks) =>
                      tasks.filter((_, index) => index != i()),
                    );
                  }}
                >
                  {() => task().text}
                </TaskItem>
              </li>
            )}
          />
        </TaskList>
      </>
    );
  }
}

defineComponents("todo-", TaskList, TaskItem);
defineComponents(App);
