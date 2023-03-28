import { build, emptyDir } from "https://deno.land/x/dnt@0.33.1/mod.ts";
import pkg from "../package.json" assert { type: "json" };

await emptyDir("./dist");

await build({
  entryPoints: [
    "./mod.ts",
    {
      name: "./dom",
      path: "./src/dom/mod.ts",
    },
    ...["01-counter", "02-todo", "03-styles"].map(
      (example) => `./examples/${example}/main.tsx`
    ),
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
