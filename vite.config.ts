import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SocketIOPluginVite } from './src/lib/socketio_plugin'

export default defineConfig({
	plugins: [
		sveltekit(),
		{...SocketIOPluginVite, apply: 'serve'}
	]
});
