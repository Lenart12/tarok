import { fail, redirect } from '@sveltejs/kit';
import {
  create_magic_token,
  consume_pin,
  find_or_create_account,
  create_session_cookie,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from '$lib/auth';
import { send_magic_link } from '$lib/email';

function safe_redirect(value: FormDataEntryValue | null): string {
  return typeof value === 'string' && value.startsWith('/') ? value : '/';
}

export const actions = {
  send: async ({ request, url }) => {
    const data = await request.formData();
    const email = (data.get('email') as string | null)?.trim() ?? '';
    const redirect_to = safe_redirect(data.get('redirect'));

    if (!email.includes('@') || email.length < 3) {
      return fail(400, { email, error: 'Vnesite veljaven e-poštni naslov.' });
    }

    const { token, pin } = create_magic_token(email);
    const link = `${url.origin}/auth/verify?token=${token}&redirect=${encodeURIComponent(redirect_to)}`;
    await send_magic_link(email, link, pin);

    return { sent: true, email };
  },

  pin: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = (data.get('email') as string | null)?.trim() ?? '';
    const pin = (data.get('pin') as string | null)?.trim() ?? '';
    const redirect_to = safe_redirect(data.get('redirect'));

    if (consume_pin(email, pin) === undefined) {
      return fail(400, { sent: true, email, error: 'Napačna ali potekla koda.' });
    }

    const account = find_or_create_account(email);
    cookies.set(SESSION_COOKIE, create_session_cookie(account.id), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
    });

    throw redirect(303, redirect_to);
  },
};
