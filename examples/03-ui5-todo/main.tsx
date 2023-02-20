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
import { h, Control, Ui5Renderer } from "../../src/ui5/mod.ts";

interface Task {
  id: string;
  done: boolean;
  text: string;
}

const Page = Control.fromUi5Control<{
  title?: OptionalSignal<string>;
}>("sap/m/Page");

const List = Control.fromUi5Control("sap/m/List");

const CustomListItem = Control.fromUi5Control<{
  onPress?: (evt: any) => void;
}>("sap/m/CustomListItem");

const Button = Control.fromUi5Control<{
  icon?: OptionalSignal<string>;
  tooltip?: OptionalSignal<string>;
}>("sap/m/Button");

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

        <List>
          <For source={tasks} key={(task) => task.id}>
            {(task) => <CustomListItem></CustomListItem>}
          </For>
        </List>
      </Page>
    );
  }
}

const renderer = new Ui5Renderer();

renderer.mountToDom(<App />, document.getElementById("root")!);
