import type { Handle } from '@sveltejs/kit';
import inject_socketio from '$lib/game_connection_controller';
import { SESSION_COOKIE, account_from_session } from '$lib/auth';

global.httpServer?.then((httpServer) => inject_socketio(httpServer));

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.account = account_from_session(event.cookies.get(SESSION_COOKIE));
  return resolve(event);
};
