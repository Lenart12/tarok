import { fail, redirect } from '@sveltejs/kit';
import { get_room, get_state } from '$lib/room_controler';
import { save_account } from '$lib/auth';

export const prerender = false;

export const actions = {
  update_name: async ({ request, locals }) => {
    if (locals.account === undefined) throw redirect(303, '/login?redirect=/profil');

    const data = await request.formData();
    const name = (data.get('display_name') as string | null)?.trim() ?? '';
    if (name.length === 0) return fail(400, { error: 'Ime ne sme biti prazno.' });
    if (name.length > 40) return fail(400, { error: 'Ime je predolgo.' });

    locals.account.display_name = name;
    save_account(locals.account);
    return { success: true };
  },
};

export function load({ locals }) {
  if (locals.account === undefined) throw redirect(303, '/login?redirect=/profil');

  const rooms = [];
  for (const { room_id, player_id } of locals.account.claims) {
    const room = get_room(room_id);
    if (room === undefined) continue;
    const index = room.player_ids.indexOf(player_id);
    if (index === -1) continue;

    const state = get_state(room_id);
    let points = room.starting_points?.[index] ?? 0;
    let radelci = room.starting_radelci?.[index] ?? 0;
    for (const round of state.rounds) {
      points += round.points_change?.[index] ?? 0;
      radelci += round.radelc_change?.[index] ?? 0;
    }

    rooms.push({
      room_id,
      title: room.title,
      created: room.created,
      player_name: room.player_names[index],
      points,
      radelci,
      round_count: state.rounds.length,
    });
  }

  rooms.sort((a, b) => b.created - a.created);

  return {
    account: { email: locals.account.email, display_name: locals.account.display_name },
    rooms,
    total_points: rooms.reduce((sum, r) => sum + r.points, 0),
    total_rounds: rooms.reduce((sum, r) => sum + r.round_count, 0),
  };
}
