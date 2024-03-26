import { autoDefine } from "shingo";
import {
  Component,
  event,
  For,
  FunctionalComponent,
  If,
  prop,
  Template,
  useSignal,
} from "shingo";

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

const HostDisplayBlock: FunctionalComponent = () => (
  <style>{`:host { display: block; }`}</style>
);

class TaskList extends Component({
  newTaskText: prop<string>(""),
  children: true,
  onTaskItemAdd: event<{
    text: string;
  }>(),
}) {
  static tagName = "task-list";

  render(): Template {
    return (
      <>
        <p>
          <form
            onsubmit={(evt) => {
              evt.preventDefault();
              if (this.newTaskText == "") return;

              this.props.newTaskText.set("");
              this.events.onTaskItemAdd({
                detail: {
                  text: this.newTaskText,
                },
              });
            }}
          >
            <input
              type="text"
              autofocus
              value={this.props.newTaskText}
              oninput={(evt) => {
                this.newTaskText = evt.currentTarget.value;
              }}
            />{" "}
            <button type="submit">Add</button>
          </form>
        </p>

        <ul>
          <slot></slot>
        </ul>

        <HostDisplayBlock />
      </>
    );
  }
}

class TaskItem extends Component({
  completed: prop<boolean>(false, {
    attribute: (value) => value != null,
  }),
  children: true,
  onTaskItemCompletedChange: event<boolean>(),
  onTaskItemDelete: event(MouseEvent),
}) {
  static tagName = "task-item";

  render(): Template {
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

class App extends Component({}, { shadowDOM: false }) {
  render(): Template {
    const [tasks, setTasks] = useSignal<Task[]>([
      {
        id: 0,
        text: "Learn about Web Components",
        completed: false,
      },
    ]);

    return autoDefine(
      "todo-",
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

        <HostDisplayBlock />
      </>,
    );
  }
}

customElements.define("app-component", App);
