import { redirect } from '@sveltejs/kit';
import { leaderboard, played_with } from '$lib/rating';

export const prerender = false;

export function load({ locals }) {
  if (locals.account === undefined) throw redirect(303, '/login?redirect=/lestvica');
  return leaderboard(played_with(locals.account));
}
