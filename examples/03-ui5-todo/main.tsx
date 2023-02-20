/**
 * @jsx h
 * @jsxFrag Fragment
 */

import {
  RendererScope,
  Component,
  Fragment,
  OptionalSignal,
} from "../../src/mod.ts";
import { For } from "../../src/renderer/for.ts";
import { Ui5EventHandler } from "../../src/ui5/jsx.ts";
import { h, Control, Ui5Renderer } from "../../src/ui5/mod.ts";
import { Ui5Control } from "../../src/ui5/ui5_renderer.ts";

interface Task {
  id: string;
  done: boolean;
  text: string;
}

const [Page, Bar, List, CustomListItem, Input, CheckBox, Button] =
  await Promise.all([
    Control.fromUi5Control<{
      title?: OptionalSignal<string>;
      subHeader?: OptionalSignal<Component<any, Ui5Renderer>>;
    }>("sap/m/Page"),

    Control.fromUi5Control("sap/m/Page"),

    Control.fromUi5Control<{
      mode?: OptionalSignal<string>;
      onDelete?: Ui5EventHandler<Ui5Control, { listItem: Ui5Control }>;
    }>("sap/m/List"),

    Control.fromUi5Control("sap/m/CustomListItem"),

    Control.fromUi5Control<{
      value?: OptionalSignal<string>;
      onLiveChange?: Ui5EventHandler<Ui5Control, { value: string }>;
      onSubmit?: Ui5EventHandler<Ui5Control, any>;
    }>("sap/m/Input"),

    Control.fromUi5Control<{
      text?: OptionalSignal<string>;
      selected?: OptionalSignal<boolean>;
      onSelect?: Ui5EventHandler<Ui5Control, any>;
    }>("sap/m/CheckBox"),

    Control.fromUi5Control<{
      type?: OptionalSignal<string>;
      icon?: OptionalSignal<string>;
      tooltip?: OptionalSignal<string>;
    }>("sap/m/Button"),
  ]);

class App extends Component<{}, Ui5Renderer> {
  render(s: RendererScope<Ui5Renderer>): Component<any, Ui5Renderer> {
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
      <Page title="Todo">
        <headerContent>
          <Button icon="sap-icon://add" tooltip="Add" />
        </headerContent>

        <List
          mode="Delete"
          onDelete={(evt) => {
            const index = evt
              .getSource()
              .indexOfItem(evt.getParameters().listItem);

            setTasks((tasks) => tasks.filter((_, i) => i !== index));
          }}
        >
          <For source={tasks} key={(task) => task.id}>
            {(task, i) => (
              <CustomListItem>
                <CheckBox
                  class={() => (task().done ? "done" : "")}
                  selected={() => task().done}
                  text={() => task().text}
                  onSelect={() => {
                    setTasks((tasks) => {
                      const newTasks = [...tasks];

                      newTasks[i()] = {
                        ...tasks[i()],
                        done: !tasks[i()].done,
                      };

                      return newTasks;
                    });
                  }}
                />
              </CustomListItem>
            )}
          </For>
        </List>
      </Page>
    );
  }
}

const renderer = new Ui5Renderer();

renderer.mountToDom(<App />, document.body);
