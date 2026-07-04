import fs from 'fs';
import {
  RoundType,
  NewRoundType,
  round_type_game,
  round_base_value,
  round_type_name,
  game_is_solo,
  type GameRound,
  type NewRoundOsnovno,
} from './tarok';
import { game_made } from './stats';
import { get_room, get_state, list_room_ids } from './room_controler';
import { get_claims } from './claims';
import { get_account, type Account } from './auth';

// ---------------------------------------------------------------------------
// Elo constants (all tunable in one place).
// ---------------------------------------------------------------------------
const INITIAL = 1500; // starting rating for every account
const BASELINE = 1500; // assumed strength of anonymous (unclaimed) seats
const SCALE = 400; // Elo logistic scale
const K_NEW = 40; // K while provisional
const K_ESTABLISHED = 12; // K once settled (lowered from 20 — calibration showed lower K predicts better)
export const PROVISIONAL_GAMES = 30; // rated hands before a rating is "established"
const RENONS_PENALTY = 15; // flat rating deduction for a renons offender
const RADELC_C = 5; // rating per leftover-radelc deviation from room average
const RADELC_CAP = 15; // clamp on the per-room radelci adjustment
const MIN_ROOM_ROUNDS = 5; // minimum rated rounds before radelci efficiency counts
const MADE_PSEUDO = 10; // Bayesian pseudo-count for made-rate smoothing
const P0_MIN = 0.05;
const P0_MAX = 0.95;
const MARGIN_GAIN = 0; // margin weighting disabled — calibration showed it added noise, not signal
const W_MIN = 0.7;
const W_MAX = 1.8;

const RATINGS_FILE = 'ratings.json';

export interface RatingRecord {
  rating: number;
  games: number;
  peak: number;
  updated: number;
}

export type Ratings = Record<string, RatingRecord>;

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

function expected(rating_a: number, rating_b: number, offset = 0): number {
  return 1 / (1 + Math.pow(10, (rating_b - rating_a - offset) / SCALE));
}

function k_for(games: number): number {
  return games < PROVISIONAL_GAMES ? K_NEW : K_ESTABLISHED;
}

// A game type's difficulty enters through the expected score: at equal ratings
// the declarer's expectation should equal that type's league-wide made-rate.
function made_rate_offset(p0: number): number {
  return SCALE * Math.log10(p0 / (1 - p0));
}

// Margin of victory only ever raises the stake (never below 1): a decisive
// result (large razlika relative to the game's own value) moves rating more.
// Berač/pikolo/valat are pass/fail with no razlika, so they stay at w = 1.
function margin_weight(round: GameRound): number {
  if (round_type_game(round.round_type) !== NewRoundType.Osnovno) return 1;
  const raw = round.round as Partial<NewRoundOsnovno> | undefined;
  if (raw === undefined || typeof raw.razlika !== 'string') return 1;
  const razlika = Math.abs(parseInt(raw.razlika.substring(1)));
  if (!Number.isFinite(razlika)) return 1;
  const norm = razlika / (round_base_value(round.round_type) || 10);
  return clamp(1 + MARGIN_GAIN * Math.log1p(norm), W_MIN, W_MAX);
}

// Declaring team = declarer (+ called partner, when there is one); everyone else
// defends. Mirrors the team logic in stats.ts (aggregate_stats).
export function round_teams(round: GameRound): { active: number[]; passive: number[]; player_count: number } | null {
  const kind = round_type_game(round.round_type);
  if (kind !== NewRoundType.Osnovno && kind !== NewRoundType.Opravljanje) return null;
  const player_count = round.points_change?.length ?? 0;
  if (player_count < 2) return null;
  const declarer = round.primary_player;
  if (declarer < 0 || declarer >= player_count) return null;

  const raw = round.round as Partial<NewRoundOsnovno> | undefined;
  const partner =
    kind === NewRoundType.Osnovno &&
      raw?.rufan_igralec !== undefined &&
      raw.rufan_igralec !== declarer &&
      !game_is_solo(player_count, round.round_type)
      ? raw.rufan_igralec
      : undefined;

  const active = partner !== undefined ? [declarer, partner] : [declarer];
  const passive: number[] = [];
  for (let i = 0; i < player_count; i++) if (!active.includes(i)) passive.push(i);
  return { active, passive, player_count };
}

interface RoomData {
  created: number;
  player_count: number;
  starting_radelci: number[];
  rounds: GameRound[];
  seat_account: (string | undefined)[]; // seat index -> claimed account id (or undefined)
}

// ---------------------------------------------------------------------------
// Full deterministic recompute. Rebuilds every rating from the persisted room
// files, so retroactive edits never cause drift.
// ---------------------------------------------------------------------------
export function recompute_ratings(): Ratings {
  const ratings: Ratings = {};
  const ensure = (id: string): RatingRecord =>
    (ratings[id] ??= { rating: INITIAL, games: 0, peak: INITIAL, updated: Date.now() });
  const rating_of = (room: RoomData, seat: number): number => {
    const account = room.seat_account[seat];
    return account ? ensure(account).rating : BASELINE;
  };
  const bump = (id: string, delta: number, counts_as_game: boolean) => {
    const rec = ensure(id);
    rec.rating += delta;
    if (counts_as_game) rec.games += 1;
    rec.peak = Math.max(rec.peak, rec.rating);
  };
  const k_of = (id: string): number => k_for(ensure(id).games);

  // Gather every room's data once.
  const rooms: RoomData[] = [];
  for (const room_id of list_room_ids()) {
    const room = get_room(room_id);
    if (room === undefined) continue;
    const state = get_state(room_id);
    const claims = get_claims(room_id);
    rooms.push({
      created: room.created ?? 0,
      player_count: room.player_names.length,
      starting_radelci: room.starting_radelci ?? [],
      rounds: state.rounds ?? [],
      seat_account: room.player_ids.map((pid) => claims[pid]),
    });
  }

  // Difficulty pre-pass: league-wide made-rate per declarer game type.
  const made = new Map<RoundType, { made: number; total: number }>();
  for (const room of rooms) {
    for (const round of room.rounds) {
      const kind = round_type_game(round.round_type);
      if (kind !== NewRoundType.Osnovno && kind !== NewRoundType.Opravljanje) continue;
      const t = made.get(round.round_type) ?? { made: 0, total: 0 };
      t.total += 1;
      if (game_made(round)) t.made += 1;
      made.set(round.round_type, t);
    }
  }
  const smoothed_prior = (t: { made: number; total: number } | undefined): number =>
    clamp(t ? (t.made + 0.5 * MADE_PSEUDO) / (t.total + MADE_PSEUDO) : 0.5, P0_MIN, P0_MAX);
  const offset_for = (rt: RoundType): number => made_rate_offset(smoothed_prior(made.get(rt)));

  // Snapshot the difficulty priors for the info page.
  prior_cache = [...made.entries()]
    .map(([rt, t]) => ({
      round_type: rt,
      name: round_type_name(rt),
      base_value: round_base_value(rt),
      sample: t.total,
      made_rate: t.total > 0 ? t.made / t.total : 0,
      prior: smoothed_prior(t),
    }))
    .sort((a, b) => b.prior - a.prior);

  // Flatten to rated hands and replay in an approximate chronological order.
  interface Hand {
    created: number;
    round_index: number;
    room: RoomData;
    round: GameRound;
  }
  const hands: Hand[] = [];
  for (const room of rooms) {
    room.rounds.forEach((round, round_index) => {
      if (round.round_type === RoundType.Rocno) return;
      hands.push({ created: room.created, round_index, room, round });
    });
  }
  hands.sort((a, b) => a.created - b.created || a.round_index - b.round_index);

  for (const { room, round } of hands) {
    switch (round_type_game(round.round_type)) {
      case NewRoundType.Renons:
        apply_renons(round, room, bump);
        break;
      case NewRoundType.Klop:
        apply_klop(round, room, rating_of, k_of, bump);
        break;
      case NewRoundType.Osnovno:
      case NewRoundType.Opravljanje:
        apply_declarer(round, room, rating_of, k_of, bump, offset_for);
        break;
    }
  }

  // Final per-room radelci-efficiency pass (order-independent).
  for (const room of rooms) apply_radelci(room, bump);

  save_ratings(ratings);
  return ratings;
}

function apply_declarer(
  round: GameRound,
  room: RoomData,
  rating_of: (room: RoomData, seat: number) => number,
  k_of: (id: string) => number,
  bump: (id: string, delta: number, counts_as_game: boolean) => void,
  offset_for: (rt: RoundType) => number,
) {
  const teams = round_teams(round);
  if (teams === null || teams.active.length === 0 || teams.passive.length === 0) return;

  const s_a = game_made(round) ? 1 : 0;
  const avg_a = mean(teams.active.map((i) => rating_of(room, i)));
  const avg_b = mean(teams.passive.map((i) => rating_of(room, i)));
  const e_a = expected(avg_a, avg_b, offset_for(round.round_type));
  const w = margin_weight(round);

  for (const seat of teams.active) {
    const account = room.seat_account[seat];
    if (account !== undefined) bump(account, k_of(account) * w * (s_a - e_a), true);
  }
  for (const seat of teams.passive) {
    const account = room.seat_account[seat];
    if (account !== undefined) bump(account, k_of(account) * w * ((1 - s_a) - (1 - e_a)), true);
  }
}

function apply_renons(
  round: GameRound,
  room: RoomData,
  bump: (id: string, delta: number, counts_as_game: boolean) => void,
) {
  const offender = round.primary_player;
  const account = room.seat_account[offender];
  if (account !== undefined) bump(account, -RENONS_PENALTY, false);
}

function apply_klop(
  round: GameRound,
  room: RoomData,
  rating_of: (room: RoomData, seat: number) => number,
  k_of: (id: string) => number,
  bump: (id: string, delta: number, counts_as_game: boolean) => void,
) {
  const n = round.points_change?.length ?? 0;
  if (n < 2) return;
  const points = (seat: number) => round.points_change?.[seat] ?? 0;

  // Free-for-all: every ordered pair is a mini-match on the point ranking,
  // K spread across the (n-1) opponents so a klop isn't worth n normal hands.
  const deltas: { account: string; delta: number }[] = [];
  for (let i = 0; i < n; i++) {
    const account = room.seat_account[i];
    if (account === undefined) continue;
    let delta = 0;
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const s_ij = points(i) > points(j) ? 1 : points(i) < points(j) ? 0 : 0.5;
      delta += (s_ij - expected(rating_of(room, i), rating_of(room, j))) / (n - 1);
    }
    deltas.push({ account, delta: k_of(account) * delta });
  }
  // Apply after computing all deltas so pairs use pre-update ratings.
  for (const { account, delta } of deltas) bump(account, delta, true);
}

function apply_radelci(
  room: RoomData,
  bump: (id: string, delta: number, counts_as_game: boolean) => void,
) {
  const rated_rounds = room.rounds.filter(
    (r) => r.round_type !== RoundType.Rocno && r.round_type !== RoundType.Renons,
  ).length;
  if (rated_rounds < MIN_ROOM_ROUNDS) return;

  const leftover: number[] = [];
  for (let i = 0; i < room.player_count; i++) {
    let r = room.starting_radelci?.[i] ?? 0;
    for (const round of room.rounds) r += round.radelc_change?.[i] ?? 0;
    leftover.push(r);
  }
  const avg = mean(leftover);
  for (let i = 0; i < room.player_count; i++) {
    const account = room.seat_account[i];
    if (account === undefined) continue;
    bump(account, clamp(-RADELC_C * (leftover[i] - avg), -RADELC_CAP, RADELC_CAP), false);
  }
}

// ---------------------------------------------------------------------------
// Persistence + cache. Ratings are recomputed on first access (authoritative,
// never trusting the socket channel) and after a debounced round commit.
// ---------------------------------------------------------------------------
let cache: Ratings | null = null;
let recompute_timer: NodeJS.Timeout | undefined;

export interface PriorInfo {
  round_type: RoundType;
  name: string;
  base_value: number;
  sample: number;
  made_rate: number; // raw made / total
  prior: number; // smoothed & clamped probability used in the expected score
}

let prior_cache: PriorInfo[] | null = null;

// Key rating parameters, exposed for the info page (single source of truth).
export const RATING_INFO = {
  initial: INITIAL,
  scale: SCALE,
  k_new: K_NEW,
  k_established: K_ESTABLISHED,
  provisional_games: PROVISIONAL_GAMES,
  renons_penalty: RENONS_PENALTY,
  radelc_per_deviation: RADELC_C,
  radelc_cap: RADELC_CAP,
  min_room_rounds: MIN_ROOM_ROUNDS,
};

// The latest empirical difficulty priors (per game type). Recomputing the
// ratings also refreshes this snapshot.
export function get_priors(): PriorInfo[] {
  if (prior_cache === null) get_ratings();
  return prior_cache ?? [];
}

export function save_ratings(ratings: Ratings) {
  fs.writeFileSync(RATINGS_FILE, JSON.stringify(ratings));
}

export function get_ratings(): Ratings {
  if (cache === null) cache = recompute_ratings();
  return cache;
}

export function schedule_recompute() {
  clearTimeout(recompute_timer);
  recompute_timer = setTimeout(() => {
    cache = recompute_ratings();
  }, 60000);
}

export interface LeaderboardRow {
  account_id: string;
  display_name: string;
  rating: number;
  games: number;
  peak: number;
  provisional: boolean;
}

// The set of accounts a viewer has shared a room with (has a claimed seat in the
// same room), including themselves. Used to scope the leaderboard.
export function played_with(account: Account): Set<string> {
  const seen = new Set<string>([account.id]);
  const room_ids = new Set(account.claims.map((c) => c.room_id));
  for (const room_id of room_ids) {
    for (const acc of Object.values(get_claims(room_id))) seen.add(acc);
  }
  return seen;
}

// When `only` is given, restrict the leaderboard to those account ids.
export function leaderboard(only?: Set<string>): { established: LeaderboardRow[]; provisional: LeaderboardRow[] } {
  const ratings = get_ratings();
  const rows: LeaderboardRow[] = [];
  for (const [account_id, rec] of Object.entries(ratings)) {
    if (rec.games === 0) continue;
    if (only !== undefined && !only.has(account_id)) continue;
    const account = get_account(account_id);
    if (account === undefined) continue;
    rows.push({
      account_id,
      display_name: account.display_name,
      rating: Math.round(rec.rating),
      games: rec.games,
      peak: Math.round(rec.peak),
      provisional: rec.games < PROVISIONAL_GAMES,
    });
  }
  rows.sort((a, b) => b.rating - a.rating);
  return {
    established: rows.filter((r) => !r.provisional),
    provisional: rows.filter((r) => r.provisional),
  };
}

export function rating_for(account_id: string): LeaderboardRow | null {
  const rec = get_ratings()[account_id];
  if (rec === undefined) return null;
  const account = get_account(account_id);
  return {
    account_id,
    display_name: account?.display_name ?? '?',
    rating: Math.round(rec.rating),
    games: rec.games,
    peak: Math.round(rec.peak),
    provisional: rec.games < PROVISIONAL_GAMES,
  };
}
