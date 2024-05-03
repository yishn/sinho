---
sidebar_position: 1
---

# Installation

Use npm to install Sinho:

```
npm install sinho
```

Sinho works out of the box with TypeScript. To use JSX, you can use the
following `tsconfig.json` options:

```js
{
  "compilerOptions": {
    "moduleResolution": "NodeNext",
    "jsx": "react-jsx",
    "jsxImportSource": "sinho"
    // …
  }
  // …
}
```

If you do not use TypeScript, you need to transform JSX, e.g. with Babel and
[@babel/plugin-transform-react-jsx](https:abeljs.io/docs/babel-plugin-transform-react-jsx):

```js
{
  "plugins": [
    [
      "@babel/plugin-transform-react-jsx",
      {
        "runtime": "automatic",
        "importSource": "sinho"
      }
    ]
    // …
  ]
  // …
}
```

Alternatively, you can also write templates using pure JavaScript. We will be
using TypeScript and JSX for the rest of the guide.
