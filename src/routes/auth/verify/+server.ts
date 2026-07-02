import { redirect } from '@sveltejs/kit';
import {
  consume_magic_token,
  find_or_create_account,
  create_session_cookie,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from '$lib/auth';

function safe_redirect(value: string | null): string {
  return value && value.startsWith('/') ? value : '/';
}

export function GET({ url, cookies }) {
  const token = url.searchParams.get('token');
  const redirect_to = safe_redirect(url.searchParams.get('redirect'));

  const email = token ? consume_magic_token(token) : undefined;
  if (email === undefined) throw redirect(303, '/login?error=invalid');

  const account = find_or_create_account(email);
  cookies.set(SESSION_COOKIE, create_session_cookie(account.id), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
  });

  throw redirect(303, redirect_to);
}
