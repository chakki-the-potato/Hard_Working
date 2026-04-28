import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import redirectMap from './scripts/redirect-map.json' with { type: 'json' };

export default defineConfig({
  site: 'https://chakki-the-potato.github.io',
  base: '/Hard_Working/',
  redirects: redirectMap,
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
});
