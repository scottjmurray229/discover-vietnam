// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

import cloudflare from '@astrojs/cloudflare';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://discovervietnam.info',
  server: { host: true },
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [sitemap({
    serialize(item) {
      item.lastmod = new Date().toISOString();
      return item;
    },
  }), react()],
  adapter: cloudflare()
});
