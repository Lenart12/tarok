import type { ViteDevServer } from 'vite';
import inject_socketio from './game_connection_controller';

export const SocketIOPluginVite = {
  name: 'socketio_plugin_vite',
  configureServer(server: ViteDevServer) {
    if (server.httpServer === null) {
      throw new Error('httpServer is null');
    }
    inject_socketio(server.httpServer);
  },
};
