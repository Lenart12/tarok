import { error, json } from '@sveltejs/kit';
import { get_room } from '$lib/room_controler';
import { get_claims, get_claims_display, claim_seat, unclaim_seat } from '$lib/claims';

export function GET({ params }) {
  return json(get_claims_display(params.room_id));
}

export async function POST({ params, request, locals }) {
  if (locals.account === undefined) throw error(401, 'Ni prijave');

  const { player_id } = await request.json();
  const room = get_room(params.room_id);
  if (room === undefined || !room.player_ids.includes(player_id)) throw error(404, 'Ni takega igralca');

  const owner = get_claims(params.room_id)[player_id];
  if (owner !== undefined && owner !== locals.account.id) throw error(409, 'Mesto je že zasedeno');

  claim_seat(params.room_id, player_id, locals.account.id);
  return json(get_claims_display(params.room_id));
}

export async function DELETE({ params, request, locals }) {
  if (locals.account === undefined) throw error(401, 'Ni prijave');

  const { player_id } = await request.json();
  unclaim_seat(params.room_id, player_id, locals.account.id);
  return json(get_claims_display(params.room_id));
}
