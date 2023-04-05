import { build, emptyDir } from "https://deno.land/x/dnt@0.33.1/mod.ts";
import pkg from "../package.json" assert { type: "json" };

await emptyDir("./dist");

await build({
  entryPoints: [
    "./src/mod.ts",
    {
      name: "./jsx-runtime",
      path: "./src/jsx-runtime.ts",
    },
    {
      name: "./dom",
      path: "./src/dom/mod.ts",
    },
    {
      name: "./dom/jsx-runtime",
      path: "./src/dom/jsx-runtime.ts",
    },
  ],
  outDir: "./dist",
  shims: {
    deno: true,
  },
  package: pkg,
  compilerOptions: {
    lib: ["es2021", "dom"],
  },
});

Deno.copyFileSync("./LICENSE.md", "./dist/LICENSE.md");
Deno.copyFileSync("./README.md", "./dist/README.md");
