import Layout from "@theme/Layout";
import { Playground } from "../components/playground";
import { useState } from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";

export default function PlaygroundPage() {
  const [src, setSrc] = useState(`\
import { Component, useSignal, defineComponents } from "sinho";

class Counter extends Component("x-counter") {
  render() {
    const [value, setValue] = useSignal(0);

    return (
      <>
        <p>Counter: {value}</p>
        <p>
          <button onclick={() => setValue((n) => n + 1)}>Increment</button>{" "}
          <button onclick={() => setValue((n) => n - 1)}>Decrement</button>
        </p>
      </>
    );
  }
}

defineComponents(Counter);
document.body.append(new Counter());`);

  return (
    <Layout
      title="Playground"
      description="A lightweight signal-based library for building web components with a React-like API."
      noFooter
    >
      <div
        style={{
          alignSelf: "stretch",
          flex: 1,
          display: "flex",
          alignItems: "stretch",
        }}
      >
        <BrowserOnly>
          {() => {
            const { MonacoEditor } =
              require("../components/monacoEditor") as typeof import("../components/monacoEditor");

            return (
              <MonacoEditor
                style={{ flex: 1, overflow: "hidden" }}
                text={src}
                onChange={(src) => setSrc(src)}
              />
            );
          }}
        </BrowserOnly>
        <Playground
          style={{ flex: 1, marginBottom: 0, overflow: "hidden" }}
          customCode={src}
        />
      </div>
    </Layout>
  );
}
