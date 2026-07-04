import { leaderboard } from '$lib/rating';

export const prerender = false;

export function load() {
  return leaderboard();
}
