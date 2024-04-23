import {
  h,
  Component,
  prop,
  Fragment,
  Style,
  css,
  defineComponents,
  useSignal,
  useEffect,
  MaybeSignal,
} from "shingo";
import initSwc, { transformSync } from "@swc/wasm-web";
import { useColorMode } from "@docusaurus/theme-common";
import useBaseUrl from "@docusaurus/useBaseUrl";
import { useEffect as useReactEffect } from "react";

export default (props: {
  headerText?: string;
  customCode?: string;
  autosize?: boolean;
}) => {
  const { colorMode } = useColorMode();
  const shingoPath = useBaseUrl("/shingo.min.js");
  const Playground: any = "x-playground";

  useReactEffect(() => {
    class Playground extends Component("x-playground", {
      colorMode: prop<"light" | "dark">("light", {
        attribute: (value) => (value === "dark" ? value : "light"),
      }),
      headerText: prop<string>("Preview", { attribute: String }),
      customCode: prop<string>("", { attribute: String }),
      autosize: prop<boolean>(false, { attribute: () => true }),
    }) {
      render() {
        const [src, setSrc] = useSignal(
          "document.body.innerHTML = '<p>Loading…</p>';",
        );

        useEffect(() => {
          const customCode = this.props.customCode();

          (async () => {
            await initSwc();
            const { code } = transformSync(customCode, {
              jsc: {
                target: "es2022",
                parser: {
                  syntax: "typescript",
                  tsx: true,
                },
                transform: {
                  react: {
                    runtime: "automatic",
                    importSource: "shingo",
                  },
                },
              },
            });

            setSrc(code);
          })();
        });

        const iframeCss = css`
          @import url("https://rsms.me/inter/inter.css");

          body {
            background: ${() =>
              this.props.colorMode() == "light" ? "#f6f8fa" : "#282a36"};
            color: ${() =>
              this.props.colorMode() == "light" ? "#1c1e21" : "#e3e3e3"};
            font-family: "Inter", sans-serif;
            margin: 0;
            padding: 0.5em 1em;
          }
        `;

        const blob = () =>
          new Blob(
            [
              `<!DOCTYPE html>
              <html>
              <head>
              <base href="${location.href}" />
              <script type="importmap">
              {
                "imports": {
                  "shingo": ${JSON.stringify(shingoPath)},
                  "shingo/jsx-runtime": ${JSON.stringify(shingoPath)}
                }
              }
              </script>
              <style>${MaybeSignal.get(iframeCss)}</style>
              <script type="module">${src()}</script>
              </head>
              <body>
              </body>
              </html>`,
            ],
            { type: "text/html" },
          );

        return h(Fragment, {}, [
          h.div({ class: "header" }, this.props.headerText),

          h.iframe({
            src: () => URL.createObjectURL(blob()),
            onload: (evt) => {
              if (!this.props.autosize()) return;

              const bodySize =
                evt.currentTarget.contentWindow!.document.body.getBoundingClientRect();

              evt.currentTarget.width = bodySize.width + "px";
              evt.currentTarget.height = bodySize.height + "px";
            },
          }),

          h(
            Style,
            {},
            css`
              :host {
                display: block;
                position: relative;
              }

              .header {
                border-bottom: 1px solid var(--ifm-color-emphasis-300);
                font-size: var(--ifm-code-font-size);
                font-weight: 500;
                padding: 0.75rem var(--ifm-pre-padding);
                border-top-left-radius: var(--ifm-code-border-radius);
                border-top-right-radius: var(--ifm-code-border-radius);
                background: ${() =>
                  this.props.colorMode() == "light" ? "#f6f8fa" : "#282a36"};
              }

              iframe {
                display: block;
                border: none;
                width: 100%;
              }
            `,
          ),
        ]);
      }
    }

    try {
      defineComponents(Playground);
    } catch (err) {
      console.error(err);
    }
  }, []);

  return (
    <Playground
      color-mode={colorMode}
      header-text={props.headerText}
      autosize={props.autosize}
      custom-code={props.customCode}
    />
  );
};
