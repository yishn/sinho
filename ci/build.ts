import { build, emptyDir } from "https://deno.land/x/dnt@0.33.1/mod.ts";

await emptyDir("./dist");

await build({
  entryPoints: [
    "./src/mod.ts",
    {
      name: "./dom",
      path: "./src/dom/mod.ts",
    },
  ],
  outDir: "./dist",
  shims: {
    deno: true,
  },
  package: JSON.parse(Deno.readTextFileSync("./package.json")),
  compilerOptions: {
    lib: ["es2021", "dom"],
  },
});

// post build steps
Deno.copyFileSync("./LICENSE.md", "./dist/LICENSE.md");
Deno.copyFileSync("./README.md", "./dist/README.md");
