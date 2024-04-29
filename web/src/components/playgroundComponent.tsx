/** @jsxImportSource shingo */

import {
  Component,
  prop,
  Style,
  css,
  defineComponents,
  useSignal,
  useEffect,
  MaybeSignal,
} from "shingo";

export class Playground extends Component("x-playground", {
  colorMode: prop<"light" | "dark">("light", {
    attribute: (value) => (value === "dark" ? value : "light"),
  }),
  headerText: prop<string>("Preview", {
    attribute: String,
  }),
  importMap: prop<{ imports: Record<string, string> }>(
    { imports: {} },
    { attribute: JSON.parse },
  ),
  customCode: prop<string>("", {
    attribute: String,
  }),
  autosize: prop<boolean>(false, {
    attribute: () => true,
  }),
}) {
  render() {
    const [src, setSrc] = useSignal(
      "document.body.innerHTML = '<p>Loading…</p>';",
    );

    useEffect(() => {
      const customCode = this.props.customCode();

      (async () => {
        const swc = await import("@swc/wasm-web");
        await swc.default();

        const { code } = swc.transformSync(customCode, {
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
        overflow: ${() => (this.props.autosize() ? "hidden" : "auto")};
      }
    `;

    const jsBlob = () => new Blob([src()], { type: "application/javascript" });

    const htmlBlob = () =>
      new Blob(
        [
          `\
<!DOCTYPE html>
<html>
<head>
<base href="${location.href}" />
<script type="importmap">${JSON.stringify(this.props.importMap())}</script>
<style>${MaybeSignal.get(iframeCss)}</style>
<script type="module" src="${URL.createObjectURL(jsBlob())}"></script>
</head>
<body>
</body>
</html>`,
        ],
        { type: "text/html" },
      );

    return (
      <>
        <div class="header">{this.props.headerText}</div>

        <iframe
          src={() => URL.createObjectURL(htmlBlob())}
          onload={(evt) => {
            if (!this.props.autosize()) return;

            const bodySize =
              evt.currentTarget.contentWindow!.document.body.getBoundingClientRect();

            evt.currentTarget.width = bodySize.width + "px";
            evt.currentTarget.height = bodySize.height + "px";
          }}
        />

        <Style>{css`
          :host {
            display: block;
            position: relative;
            margin-bottom: var(--ifm-leading);
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
        `}</Style>
      </>
    );
  }
}

try {
  defineComponents(Playground);
} catch (err) {
  console.error(err);
}
