// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Catbee Docs',
  tagline: 'Documentation for Catbee Packages and Tools',
  favicon: 'favicon/favicon.ico',
  future: {
    v4: true,
  },

  // Set the production url of your site here
  url: 'https://catbee.npm.hprasath.com',
  baseUrl: '/',

  headTags: [
    {
      tagName: 'meta',
      attributes: {
        name: 'description',
        content: 'Catbee Docs - A collection of reusable utility modules for Angular, Node.js and TypeScript projects.',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'keywords',
        content: 'catbee, utils, angular, node.js, typescript, javascript, utilities, library, npm, express, modular, tree-shakable, production-ready',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:title',
        content: 'Catbee Docs - A collection of reusable utility modules for Angular, Node.js and TypeScript projects.',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:description',
        content: 'Catbee Docs - Utilities for Angular, Node.js & TypeScript.',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:type',
        content: 'website',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:url',
        content: 'https://catbee.npm.hprasath.com',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:image',
        content: 'https://catbee.npm.hprasath.com/favicon/android-chrome-512x512.png',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:title',
        content: 'Reusable utility modules for Angular, Node.js and TypeScript, designed for performance and simplicity.',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:description',
        content: 'Reusable utility modules for Node.js and TypeScript, designed for performance and simplicity.',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:image',
        content: 'https://catbee.npm.hprasath.com/favicon/android-chrome-512x512.png',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'icon',
        href: '/favicon/favicon.ico',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'canonical',
        href: 'https://catbee.npm.hprasath.com',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'theme-color',
        content: '#000'
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'manifest',
        href: '/site.webmanifest',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/favicon/apple-touch-icon.png',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'robots',
        content: 'index, follow',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'algolia-site-verification',
        content: 'C6E636047538A2FF'
      }
    },
    {
      tagName: 'script',
      attributes: {
        type: 'application/ld+json',
      },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareSourceCode',
        name: 'Catbee Docs',
        description:
          'Catbee Docs - A collection of reusable utility modules for Angular, Node.js and TypeScript projects.',
        url: 'https://catbee.npm.hprasath.com',
        codeRepository: 'https://github.com/catbee-technologies',
        license: 'https://catbee.npm.hprasath.com/license',
        programmingLanguage: 'TypeScript',
        author: {
          '@type': 'Organization',
          name: 'Catbee Technologies',
        },
      }),
    }
  ],

  organizationName: 'catbee-technologies',
  projectName: '@catbee/utils',

  onBrokenLinks: 'throw',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn'
    }
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // showLastUpdateTime: true
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: ['./src/css/styles.css']
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    // announcementBar: {
    //   id: 'new-release',
    //   content: `🚀 Catbee Utils v1.0.x is now available on <a href="https://www.npmjs.com/package/@catbee/utils">npm</a>!`,
    //   backgroundColor: '#6a4fbc',
    //   textColor: '#ffffff',
    //   isCloseable: true,
    // },
    navbar: {
      title: 'Catbee',
      logo: {
        alt: 'Catbee Docs Logo',
        src: 'favicon/android-chrome-192x192.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        { to: '/license/', label: 'License', position: 'left' },
        // { to: '/changelog/', label: 'Changelog', position: 'left' },
        // { to: '/contributors', label: 'Contributors', position: 'left' },
        { href: 'https://github.com/catbee-technologies', label: 'GitHub', position: 'right' },
        { href: 'https://www.npmjs.com/package/@catbee/utils', label: '@catbee/utils', position: 'right' },
        { href: 'https://www.npmjs.com/package/@ng-catbee/monaco-editor', label: '@ng-catbee/monaco-editor', position: 'right' },
      ]
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} Catbee Technologies.`,
    },
    algolia: {
      appId: 'SULA4ODR5K',
      apiKey: 'c1ca6b1bdecb0c04ec41317e3e0983dc',
      indexName: 'Catbee Docs'
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    }
  } satisfies Preset.ThemeConfig,
  plugins: ['@docusaurus/plugin-client-redirects']
};

export default config;
