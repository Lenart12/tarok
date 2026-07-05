import { get_room } from '$lib/room_controler.js';
import { room_rating_deltas } from '$lib/rating';
import { error } from '@sveltejs/kit';

export const prerender = 'auto';

export function load({ params }) {
  const room = get_room(params.room_id);

  if (room === undefined) throw error(404, 'Soba ne obstaja');

  return {
    room: room,
    rating_deltas: room_rating_deltas(params.room_id),
  };
}
