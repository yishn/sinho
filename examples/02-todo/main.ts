import { h, h2, DomRenderer, text } from "../../src/html/mod.ts";
import {
  Component,
  Switch,
  For,
  RendererScope,
  mount,
} from "../../src/renderer/mod.ts";

interface Task {
  id: number;
  done: boolean;
  text: string;
}

class App extends Component<void, DomRenderer> {
  render(s: RendererScope<DomRenderer>) {
    const [id, setId] = s.signal(2);
    const [newTaskText, setNewTaskText] = s.signal("");
    const [tasks, setTasks] = s.signal<Task[]>([
      {
        id: 0,
        done: false,
        text: "Clean up",
      },
      {
        id: 1,
        done: true,
        text: "Make example",
      },
    ]);

    return h2("div")
      .attrs({
        class: () => "app",
      })
      .children(
        h2("h1").children(text("Todo!")),

        h2("form")
          .on("submit", (evt) => {
            evt.preventDefault();

            if (newTaskText().trim() !== "") {
              setTasks(
                (value) => {
                  value.push({
                    id: id(),
                    done: false,
                    text: newTaskText(),
                  });
                  return value;
                },
                { force: true }
              );
              setId((id) => id + 1);
              setNewTaskText("");
            }
          })
          .children(
            h2("p").children(
              h2("input")
                .attrs({
                  placeholder: () => "New task...",
                  value: newTaskText,
                })
                .on("input", (evt) => {
                  setNewTaskText(evt.currentTarget.value);
                }),
              text(" "),
              h2("button")
                .attrs({
                  type: () => "submit",
                })
                .children(text("+")),
              text(" "),
              h2("button")
                .on("click", (evt) => {
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
                })
                .children(text("Sort"))
            )
          ),

        h2("ul").children(
          For(tasks)
            .key((task) => task.id)
            .each((task, i) =>
              h2("li").children(
                h2("button")
                  .attrs({
                    title: () => "Remove",
                  })
                  .on("click", () => {
                    setTasks(
                      (tasks) => {
                        tasks.splice(i(), 1);
                        return tasks;
                      },
                      { force: true }
                    );
                  })
                  .children(text("-")),
                text(" "),

                h2("label").children(
                  h2("input")
                    .attrs({
                      type: () => "checkbox",
                      checked: () => task().done,
                    })
                    .on("click", () => {
                      setTasks((tasks) => {
                        const task = tasks[i()];
                        const newTasks = [...tasks];

                        newTasks[i()] = {
                          ...task,
                          done: !task.done,
                        };

                        return newTasks;
                      });
                    }),

                  h(Switch, {})
                    .when(
                      () => task().done,
                      () => h2("del").children(text(() => task().text))
                    )
                    .otherwise(() => text(() => task().text))
                )
              )
            )
        )
      );
  }
}

mount(new DomRenderer(), new App(), document.getElementById("root")!);
