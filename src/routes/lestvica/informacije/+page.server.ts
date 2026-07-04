import { get_priors, RATING_INFO } from '$lib/rating';

export const prerender = false;

export function load() {
  return { priors: get_priors(), params: RATING_INFO };
}
