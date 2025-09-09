// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Catbee Utils',
  tagline: 'Utility Modules for Node.js',
  favicon: 'favicon/favicon.ico',
  future: {
    v4: true,
  },

  // Set the production url of your site here
  url: 'https://catbee-utils.npm.hprasath.com',
  baseUrl: '/',

  headTags: [
    {
      tagName: 'meta',
      attributes: {
        name: 'description',
        content: 'Catbee Utils - A collection of reusable utility modules for Node.js and TypeScript projects.',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'keywords',
        content: 'catbee, utils, node.js, typescript, javascript, utilities, library, npm, express',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:title',
        content: 'Catbee Utils - Utility Modules for Node.js',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:description',
        content: 'A powerful and modular collection of utilities for Node.js and TypeScript projects.',
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
        content: 'https://catbee-utils.npm.hprasath.com',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:image',
        content: 'https://catbee-utils.npm.hprasath.com/favicon/android-chrome-512x512.png',
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
        content: 'Catbee Utils - Utility Modules for Node.js',
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
        content: 'https://catbee-utils.npm.hprasath.com/favicon/android-chrome-512x512.png',
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
        name: 'Catbee Utils',
        description:
          'Catbee Utils - A collection of reusable utility modules for Node.js and TypeScript projects.',
        url: 'https://catbee-utils.npm.hprasath.com',
        codeRepository: 'https://github.com/catbee-technologies/catbee-utils',
        license: 'https://opensource.org/licenses/MIT',
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
  onBrokenMarkdownLinks: 'warn',

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
    announcementBar: {
      id: 'new-release',
      content: '🚀 Catbee Utils v0.0.7 is now available on <a href="https://www.npmjs.com/package/@catbee/utils">npm</a>!',
      backgroundColor: '#6a4fbc',
      textColor: '#ffffff',
      isCloseable: true,
    },
    navbar: {
      title: 'Catbee Utils',
      logo: {
        alt: 'Catbee Utils Logo',
        src: 'favicon/android-chrome-192x192.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        { to: '/license', label: 'License', position: 'left' },
        // { to: '/contributors', label: 'Contributors', position: 'left' },
        { href: 'https://github.com/catbee-technologies/catbee-utils', label: 'GitHub', position: 'right' },
        { href: 'https://www.npmjs.com/package/@catbee/utils', label: 'NPM', position: 'right' }
      ]
    },
    footer: {
      style: 'dark',
      // logo: {
      //   alt: 'Catbee Utils Logo',
      //   src: 'favicon/android-chrome-192x192.png',
      //   href: '/',
      //   width: 32,
      //   height: 32,
      // },
      copyright: `Copyright © ${new Date().getFullYear()} Catbee Technologies.`,
    },
    algolia: {
      appId: '9XAZEAMSRU',
      apiKey: 'db1d1b7281ef681eec43858e19fbe7a9',
      indexName: 'Catbee Utils'
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    }
  } satisfies Preset.ThemeConfig,
};

export default config;
