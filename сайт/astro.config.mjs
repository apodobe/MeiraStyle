// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://osipovastyle.ru',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        '/api/meeting-booking.php': {
          target: 'http://127.0.0.1:8787',
          changeOrigin: true,
        },
        '/api/meeting-booking': {
          target: 'http://127.0.0.1:8787',
          changeOrigin: true,
        },
        '/api/meeting-attendees': {
          target: 'http://127.0.0.1:8787',
          changeOrigin: true,
        },
      },
    },
  }
});