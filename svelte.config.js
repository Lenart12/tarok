import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/kit/vite';
import fs from 'fs';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [
    vitePreprocess(),
    preprocess({
      postcss: true,
    }),
  ],

  kit: {
    adapter: {
      name: 'adapter-node+copy',
      adapt: async (...args) => {
        await adapter().adapt(...args);
        fs.copyFileSync('src/server.js', 'build/server.js');
      },
    },
  },
};

export default config;
