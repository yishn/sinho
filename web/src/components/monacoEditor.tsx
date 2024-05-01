import { useColorMode } from "@docusaurus/theme-common";
import useBaseUrl from "@docusaurus/useBaseUrl";
import * as monaco from "monaco-editor";
import { CSSProperties, FC, useEffect, useRef } from "react";

export const MonacoEditor: FC<{
  style?: CSSProperties;
  text?: string;
  onChange?: (text: string) => void;
}> = (props) => {
  const divRef = useRef<HTMLDivElement>(null);
  const typesPath = useBaseUrl("/dist/bundle.d.ts");
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
  const { colorMode } = useColorMode();

  useEffect(() => {
    (async () => {
      editorRef.current = monaco.editor.create(divRef.current!, {
        model: monaco.editor.createModel(
          props.text!,
          "typescript",
          monaco.Uri.file("/main.tsx"),
        ),
        language: "typescript",
        minimap: {
          enabled: false,
        },
        smoothScrolling: true,
        automaticLayout: true,
      });

      editorRef.current.onDidChangeModelContent(() => {
        props.onChange?.(editorRef.current!.getValue());
      });

      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        strict: true,
        jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
        jsxImportSource: "shingo",
      });

      const types = await fetch(typesPath).then((res) => res.text());

      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        `declare module "shingo" {\n${types}\n}`,
        "ts:shingo.d.ts",
      );

      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        `declare module "shingo/jsx-runtime" {\n${types}\n}`,
        "ts:shingo-jsx-runtime.d.ts",
      );
    })();

    return () => {
      editorRef.current?.getModel()!.dispose();
      editorRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    monaco.editor.setTheme(colorMode == "light" ? "vs" : "vs-dark");
  }, [colorMode]);

  useEffect(() => {
    if (editorRef.current?.getValue() != props.text) {
      editorRef.current?.setValue(props.text!);
    }
  }, [props.text]);

  return <div ref={divRef} style={props.style} />;
};
