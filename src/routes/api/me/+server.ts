import { json } from '@sveltejs/kit';

export function GET({ locals }) {
  if (locals.account === undefined) return json({ account: null, claims: [] });
  const { id, email, display_name, claims } = locals.account;
  return json({ account: { id, email, display_name }, claims });
}
