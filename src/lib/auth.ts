import fs from 'fs';
import crypto from 'crypto';
import { gen_id } from './tarok';

export interface Account {
  id: string;
  email: string;
  display_name: string;
  created: number;
  claims: { room_id: string; player_id: string }[];
}

export const SESSION_COOKIE = 'tarok_session';
const SESSION_TTL = 1000 * 60 * 60 * 24 * 90; // 90 days
export const SESSION_MAX_AGE = SESSION_TTL / 1000;
const TOKEN_TTL = 1000 * 60 * 15; // 15 minutes

const ACCOUNTS_DIR = 'accounts';
const EMAIL_INDEX = `${ACCOUNTS_DIR}/_email_index.json`;
const TOKENS_FILE = `${ACCOUNTS_DIR}/_magic_tokens.json`;

let SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  console.warn('SESSION_SECRET is not set - using an insecure development secret');
  SESSION_SECRET = 'dev-insecure-secret-change-me';
}

function ensure_dir() {
  if (!fs.existsSync(ACCOUNTS_DIR)) fs.mkdirSync(ACCOUNTS_DIR);
}

function read_json<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function write_json(file: string, data: unknown) {
  ensure_dir();
  fs.writeFileSync(file, JSON.stringify(data));
}

function normalize_email(email: string) {
  return email.trim().toLowerCase();
}

export function get_account(id: string): Account | undefined {
  return read_json<Account | undefined>(`${ACCOUNTS_DIR}/${id}.json`, undefined);
}

export function save_account(account: Account) {
  write_json(`${ACCOUNTS_DIR}/${account.id}.json`, account);
}

export function find_account_by_email(email: string): Account | undefined {
  const index = read_json<Record<string, string>>(EMAIL_INDEX, {});
  const id = index[normalize_email(email)];
  return id ? get_account(id) : undefined;
}

export function find_or_create_account(email: string): Account {
  email = normalize_email(email);
  const existing = find_account_by_email(email);
  if (existing) return existing;

  const account: Account = {
    id: gen_id(),
    email,
    display_name: email.split('@')[0],
    created: Date.now(),
    claims: [],
  };
  save_account(account);
  const index = read_json<Record<string, string>>(EMAIL_INDEX, {});
  index[email] = account.id;
  write_json(EMAIL_INDEX, index);
  return account;
}

function sign(value: string) {
  return crypto.createHmac('sha256', SESSION_SECRET as string).update(value).digest('base64url');
}

export function create_session_cookie(account_id: string) {
  const payload = `${account_id}.${Date.now() + SESSION_TTL}`;
  return `${payload}.${sign(payload)}`;
}

export function account_from_session(cookie: string | undefined): Account | undefined {
  if (!cookie) return undefined;
  const last_dot = cookie.lastIndexOf('.');
  if (last_dot === -1) return undefined;
  const payload = cookie.slice(0, last_dot);
  const sig = cookie.slice(last_dot + 1);
  if (sign(payload) !== sig) return undefined;

  const [account_id, expires] = payload.split('.');
  if (Number(expires) < Date.now()) return undefined;
  return get_account(account_id);
}

function hash_token(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

interface MagicToken {
  email: string;
  expires: number;
  pin: string;
}

function read_tokens() {
  return read_json<Record<string, MagicToken>>(TOKENS_FILE, {});
}

function prune_tokens(tokens: Record<string, MagicToken>) {
  const now = Date.now();
  for (const key of Object.keys(tokens)) {
    if (tokens[key].expires < now) delete tokens[key];
  }
}

export function create_magic_token(email: string): { token: string; pin: string } {
  const token = gen_id(32);
  const pin = String(crypto.randomInt(10000)).padStart(4, '0');
  const tokens = read_tokens();
  prune_tokens(tokens);
  tokens[hash_token(token)] = { email: normalize_email(email), expires: Date.now() + TOKEN_TTL, pin };
  write_json(TOKENS_FILE, tokens);
  return { token, pin };
}

export function consume_magic_token(token: string): string | undefined {
  const tokens = read_tokens();
  const key = hash_token(token);
  const entry = tokens[key];
  if (entry === undefined) return undefined;
  delete tokens[key];
  write_json(TOKENS_FILE, tokens);
  if (entry.expires < Date.now()) return undefined;
  return entry.email;
}

export function consume_pin(email: string, pin: string): string | undefined {
  email = normalize_email(email);
  const tokens = read_tokens();
  prune_tokens(tokens);
  const key = Object.keys(tokens).find((k) => tokens[k].email === email && tokens[k].pin === pin);
  if (key === undefined) {
    write_json(TOKENS_FILE, tokens);
    return undefined;
  }
  delete tokens[key];
  write_json(TOKENS_FILE, tokens);
  return email;
}
