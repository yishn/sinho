/* @jsx h */

import { h, DomRenderer, Text } from "../../src/html/mod.ts";
import {
  Component,
  When,
  For,
  RendererScope,
  mount,
} from "../../src/renderer/mod.ts";

interface Task {
  id: string;
  done: boolean;
  text: string;
}

class App extends Component<void, DomRenderer> {
  render(s: RendererScope<DomRenderer>) {
    const [newTaskText, setNewTaskText] = s.signal("");
    const [tasks, setTasks] = s.signal<Task[]>([
      {
        id: crypto.randomUUID(),
        done: false,
        text: "Clean up",
      },
      {
        id: crypto.randomUUID(),
        done: true,
        text: "Make example",
      },
    ]);

    return (
      <div class={() => "app"}>
        <h1>Todo!</h1>

        <form
          onSubmit={(evt) => {
            evt.preventDefault();

            if (newTaskText().trim() !== "") {
              setTasks((tasks) => [
                ...tasks,
                {
                  id: crypto.randomUUID(),
                  done: false,
                  text: newTaskText(),
                },
              ]);
              setNewTaskText("");
            }
          }}
        >
          <p>
            <input
              placeholder={() => "New task..."}
              value={newTaskText}
              onInput={(evt) => {
                setNewTaskText(evt.currentTarget.value);
              }}
            />{" "}
            <button type={() => "submit"}>+</button>{" "}
            <button
              onClick={(evt) => {
                evt.preventDefault();

                setTasks((tasks) => {
                  const result = [...tasks];
                  result.sort((x, y) =>
                    x.text.toLowerCase() < y.text.toLowerCase()
                      ? -1
                      : x.text.toLowerCase() > y.text.toLowerCase()
                      ? 1
                      : 0
                  );
                  return result;
                });
              }}
            >
              Sort
            </button>
          </p>
        </form>

        <ul>
          <For source={tasks} key={(task) => task.id}>
            {(task, i) => (
              <li>
                <button
                  title={() => "Remove"}
                  onClick={() => {
                    setTasks((tasks) => tasks.filter((_, j) => j !== i()));
                  }}
                >
                  -
                </button>{" "}
                <label>
                  <input
                    type={() => "checkbox"}
                    checked={() => task().done}
                    onClick={() => {
                      setTasks((tasks) => {
                        const task = tasks[i()];
                        const newTasks = [...tasks];

                        newTasks[i()] = {
                          ...task,
                          done: !task.done,
                        };

                        return newTasks;
                      });
                    }}
                  />

                  <When
                    condition={() => task().done}
                    then={() => <del>{() => task().text}</del>}
                    otherwise={() => <Text>{() => task().text}</Text>}
                  />
                </label>
              </li>
            )}
          </For>
        </ul>
      </div>
    );
  }
}

mount(new DomRenderer(), new App(), document.getElementById("root")!);
