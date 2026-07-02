import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE } from '$lib/auth';

export function GET({ cookies }) {
  cookies.delete(SESSION_COOKIE, { path: '/' });
  throw redirect(303, '/');
}
