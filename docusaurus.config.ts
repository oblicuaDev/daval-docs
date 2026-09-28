import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'DAVAL App',
  tagline: 'Documentación técnica del sistema comercial de Distribuciones DAVAL',
  favicon: 'img/logo-daval.jpeg',

  // Misma tipografía que la app (index.html de daval-app)
  stylesheets: [
    {
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
      type: 'text/css',
    },
  ],

  future: {
    v4: true,
  },

  // GitHub Pages: https://oblicuadev.github.io/daval-docs/
  url: 'https://oblicuadev.github.io',
  baseUrl: '/daval-docs/',
  organizationName: 'oblicuaDev',
  projectName: 'daval-docs',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'es',
    locales: ['es'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/logo-daval.jpeg',
    // La app es solo tema oscuro; la documentación también.
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'DAVAL App',
      logo: {
        alt: 'DAVAL',
        src: 'img/logo-daval.jpeg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Guía del proyecto',
        },
        {
          type: 'docSidebar',
          sidebarId: 'apiSidebar',
          position: 'left',
          label: 'Referencia API',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Proyecto',
          items: [
            {label: 'Introducción', to: '/docs/intro'},
            {label: 'Arquitectura', to: '/docs/arquitectura/vision-general'},
            {label: 'Instalación local', to: '/docs/guias/instalacion-local'},
          ],
        },
        {
          title: 'API',
          items: [
            {label: 'Convenciones', to: '/docs/api/introduccion'},
            {label: 'Autenticación', to: '/docs/api/auth'},
            {label: 'Cotizaciones', to: '/docs/api/cotizaciones'},
            {label: 'SIIGO', to: '/docs/api/siigo'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Distribuciones DAVAL.`,
    },
    prism: {
      theme: prismThemes.oneDark,
      darkTheme: prismThemes.oneDark,
      additionalLanguages: ['bash', 'sql', 'json', 'toml'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
