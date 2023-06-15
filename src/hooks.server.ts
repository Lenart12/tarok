import inject_socketio from '$lib/game_connection_controller';

global.httpServer?.then((httpServer) => inject_socketio(httpServer));
