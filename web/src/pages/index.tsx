import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";

import { CodeSnippetComponentPlayground } from "../components/playground";
import styles from "./index.module.css";
import CodeBlock from "@theme/CodeBlock";
import type { JSX } from "react";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx("hero", styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--primary button--lg"
            to="/docs/installation"
          >
            Documentation
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/playground"
          >
            Playground
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  return (
    <Layout description="A lightweight signal-based library for building web components with a React-like API.">
      <HomepageHeader />
      <main>
        <ul>
          <li>🌌 Web standards with custom HTML elements</li>
          <li>⚛️ React-like API</li>
          <li>✒️ Declarative templating with JSX (no additional parsing)</li>
          <li>🚥 Fine-grained reactivity with signals</li>
          <li>🛟 Type-safe components out of the box with TypeScript</li>
          <li>🪶 Lightweight (~4KB minified and compressed)</li>
        </ul>

        <CodeBlock language="tsx">{`\
import { Component, useSignal } from "sinho";

class MyCounter extends Component() {
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
}`}</CodeBlock>

        <CodeSnippetComponentPlayground componentName="MyCounter" />
      </main>
    </Layout>
  );
}
