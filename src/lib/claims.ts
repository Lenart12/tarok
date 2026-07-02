import fs from 'fs';
import { get_account, save_account } from './auth';

// player_id -> account_id, stored server-side so it can never be forged via the
// (fully trusting) socket sync channel.
export type Claims = Record<string, string>;

function claims_file(room_id: string) {
  return `rooms/${room_id}-claims.json`;
}

export function get_claims(room_id: string): Claims {
  try {
    return JSON.parse(fs.readFileSync(claims_file(room_id), 'utf-8')) as Claims;
  } catch {
    return {};
  }
}

export function save_claims(room_id: string, claims: Claims) {
  fs.writeFileSync(claims_file(room_id), JSON.stringify(claims));
}

export interface ClaimDisplay {
  account_id: string;
  display_name: string;
}

export function get_claims_display(room_id: string): Record<string, ClaimDisplay> {
  const claims = get_claims(room_id);
  const out: Record<string, ClaimDisplay> = {};
  for (const [player_id, account_id] of Object.entries(claims)) {
    out[player_id] = { account_id, display_name: get_account(account_id)?.display_name ?? '?' };
  }
  return out;
}

function set_account_claim(account_id: string, room_id: string, player_id: string) {
  const account = get_account(account_id);
  if (account === undefined) return;
  account.claims = account.claims.filter((c) => c.room_id !== room_id);
  account.claims.push({ room_id, player_id });
  save_account(account);
}

function clear_account_claim(account_id: string, room_id: string, player_id: string) {
  const account = get_account(account_id);
  if (account === undefined) return;
  account.claims = account.claims.filter((c) => !(c.room_id === room_id && c.player_id === player_id));
  save_account(account);
}

// One seat per account per room: re-claiming moves the account off any previous seat here.
export function claim_seat(room_id: string, player_id: string, account_id: string) {
  const claims = get_claims(room_id);
  for (const [pid, aid] of Object.entries(claims)) {
    if (aid === account_id && pid !== player_id) delete claims[pid];
  }
  claims[player_id] = account_id;
  save_claims(room_id, claims);
  set_account_claim(account_id, room_id, player_id);
}

export function unclaim_seat(room_id: string, player_id: string, account_id: string): boolean {
  const claims = get_claims(room_id);
  if (claims[player_id] !== account_id) return false;
  delete claims[player_id];
  save_claims(room_id, claims);
  clear_account_claim(account_id, room_id, player_id);
  return true;
}

// Drop claims for seats that no longer exist (called after a room is edited).
export function prune_claims(room_id: string, valid_player_ids: string[]) {
  const claims = get_claims(room_id);
  let changed = false;
  for (const [player_id, account_id] of Object.entries(claims)) {
    if (!valid_player_ids.includes(player_id)) {
      delete claims[player_id];
      clear_account_claim(account_id, room_id, player_id);
      changed = true;
    }
  }
  if (changed) save_claims(room_id, claims);
}
