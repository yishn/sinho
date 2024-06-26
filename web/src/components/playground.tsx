import { useColorMode } from "@docusaurus/theme-common";
import useBaseUrl from "@docusaurus/useBaseUrl";
import {
  CSSProperties,
  FC,
  RefObject,
  useEffect,
  useRef,
  useState,
} from "react";

export const Playground: FC<{
  innerRef?: RefObject<HTMLElement>;
  style?: CSSProperties;
  headerText?: string;
  customCode?: string;
  autosize?: boolean;
}> = (props) => {
  const { colorMode } = useColorMode();
  const sinhoPath = useBaseUrl("/dist/bundle.min.js");
  const importMap = {
    imports: {
      sinho: sinhoPath,
      "sinho/jsx-runtime": sinhoPath,
    },
  };

  useEffect(() => {
    import("./playgroundComponent");
  }, []);

  const Playground: any = "x-playground";

  return (
    <Playground
      ref={props.innerRef}
      style={props.style}
      color-mode={colorMode}
      header-text={props.headerText}
      autosize={props.autosize}
      import-map={JSON.stringify(importMap)}
      custom-code={props.customCode}
    />
  );
};

export const CodeSnippetPlayground: FC<{
  headerText?: string;
  customCode?: (code: string) => string;
}> = (props) => {
  const [customCode, setCustomCode] = useState("");
  const playgroundRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (playgroundRef.current == null) return;

    const codeElement = playgroundRef.current
      .previousElementSibling as HTMLElement | null;
    const detectedCode = codeElement?.innerText ?? "";

    setCustomCode(props.customCode?.(detectedCode) ?? detectedCode);
  }, [props.customCode]);

  return (
    <Playground
      innerRef={playgroundRef}
      autosize
      headerText={props.headerText}
      customCode={customCode}
    />
  );
};

export const CodeSnippetComponentPlayground: FC<{
  headerText?: string;
  componentName: string;
}> = (props) => {
  return (
    <CodeSnippetPlayground
      headerText={props.headerText}
      customCode={(code) =>
        `${code}
        import { defineComponents } from "sinho";
        defineComponents(${props.componentName});
        document.body.append(new ${props.componentName}());`
      }
    />
  );
};
