import { error, redirect } from '@sveltejs/kit';
import { get_room } from '$lib/room_controler';
import { get_claims } from '$lib/claims';

export const prerender = false;

export function load({ params, locals, url }) {
  const room = get_room(params.room_id);
  if (room === undefined) throw error(404, 'Soba ne obstaja');

  const seat_index = room.player_ids.indexOf(params.player_id);
  if (seat_index === -1) throw error(404, 'Ta igralec ne obstaja');

  if (locals.account === undefined) {
    throw redirect(303, `/login?redirect=${encodeURIComponent(url.pathname)}`);
  }

  const owner = get_claims(params.room_id)[params.player_id];
  return {
    room_id: params.room_id,
    room_title: room.title,
    player_id: params.player_id,
    player_name: room.player_names[seat_index],
    claimed_by_me: owner === locals.account.id,
    claimed_by_other: owner !== undefined && owner !== locals.account.id,
  };
}
