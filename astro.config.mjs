// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://yourdomain.com',

  output: 'static',

  adapter: node({
    mode: 'standalone',
  }),

  integrations: [react(), sitemap()],

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
});