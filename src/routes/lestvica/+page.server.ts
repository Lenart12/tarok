import { redirect } from '@sveltejs/kit';
import { leaderboard, room_leaderboard, played_with } from '$lib/rating';

export const prerender = false;

export function load({ locals }) {
  if (locals.account === undefined) throw redirect(303, '/login?redirect=/lestvica');
  const only = played_with(locals.account);
  return {
    hand: leaderboard(only),
    room: room_leaderboard(only),
  };
}
