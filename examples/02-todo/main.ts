import { h, DomRenderer, text } from "../../src/html/mod.ts";
import {
  Component,
  Switch,
  For,
  RendererScope,
  Rendering,
} from "../../src/renderer/mod.ts";

interface Task {
  id: number;
  done: boolean;
  text: string;
}

class App extends Component<void, DomRenderer> {
  render(s: RendererScope<DomRenderer>): Rendering<DomRenderer> {
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

    return h("div")
      .attrs({
        class: () => "app",
      })
      .children(
        h("h1").children(text("Todo!")),

        h("form")
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
            h("p").children(
              h("input")
                .attrs({
                  placeholder: () => "New task...",
                  value: newTaskText,
                })
                .on("input", (evt) => {
                  setNewTaskText(evt.currentTarget.value);
                }),
              text(" "),
              h("button")
                .attrs({
                  type: () => "submit",
                })
                .children(text("+"))
            )
          ),

        h("ul").children(
          For(tasks)
            .key((task) => task.id)
            .each((task, i) =>
              h("li").children(
                h("button")
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

                h("label").children(
                  h("input")
                    .attrs({
                      type: () => "checkbox",
                      checked: () => task().done,
                    })
                    .on("click", () => {
                      setTasks(
                        (tasks) => {
                          const task = tasks[i()];
                          tasks[i()] = {
                            ...task,
                            done: !task.done,
                          };
                          return tasks;
                        },
                        { force: true }
                      );
                    }),

                  Switch()
                    .when(
                      () => task().done,
                      () => h("del").children(text(() => task().text))
                    )
                    .otherwise(() => text(() => task().text))
                )
              )
            )
        )
      )
      .render(s);
  }
}

new DomRenderer().mount(new App(), document.getElementById("root")!);
