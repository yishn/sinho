import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const logo =
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="50" text-anchor="middle" font-size="100" dominant-baseline="central">🚥</text></svg>';

const config: Config = {
  title: "Shingō",
  tagline:
    "A lightweight signal-based library for building web components with a React-like API.",
  favicon: logo,

  // Set the production url of your site here
  url: "https://yishn.github.io",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: process.env.NODE_ENV === "production" ? "/shingo/" : "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "yishn", // Usually your GitHub org/user name.
  projectName: "shingo", // Usually your repo name.

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  headTags: [
    {
      tagName: "link",
      attributes: {
        rel: "preconnect",
        href: "https://rsms.me/",
      },
    },
    {
      tagName: "link",
      attributes: {
        rel: "stylesheet",
        href: "https://rsms.me/inter/inter.css",
      },
    },
  ],

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: "https://github.com/yishn/shingo/tree/docs/",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: logo,
    colorMode: {
      defaultMode: "dark",
    },
    navbar: {
      title: "Shingō",
      logo: {
        alt: "Shingō",
        src: logo,
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Documentation",
        },
        {
          href: "https://github.com/yishn/shingo",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      logo: {
        alt: "Shingō",
        src: logo,
        width: 32,
        height: 32,
      },
      style: "dark",
      copyright: `Copyright © ${new Date().getFullYear()} Yichuan Shen`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,

  plugins: [
    [
      "docusaurus-plugin-typedoc",
      {
        entryPoints: ["../src/mod.ts"],
        tsconfig: "../tsconfig.json",
        name: "API",
        readme: "none",
        visibilityFilters: {
          "@ignore": false,
        },
        sidebar: {
          position: 999,
        },
      },
    ],
  ],
};

export default config;
