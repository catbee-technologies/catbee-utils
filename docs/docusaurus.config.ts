import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

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
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
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
      copyright: `Copyright © ${new Date().getFullYear()} Catbee Technologies. All Rights Reserved.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    }
  } satisfies Preset.ThemeConfig,
};

export default config;
