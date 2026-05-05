// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://yourdomain.com',

  output: 'static',

  integrations: [react(), sitemap()],

  build: {
    // Inline generated CSS to avoid an extra render-blocking stylesheet request.
    // This layout shell is small enough that inlining improves first paint.
    inlineStylesheets: 'always',
  },

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
});