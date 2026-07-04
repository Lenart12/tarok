// Elo calibration / tuning analysis.
//
// Measures how well the expected-score model predicts real hand outcomes, using
// a prequential (predict-then-update, strictly online) evaluation so every
// prediction only uses past hands. Reports log-loss / Brier / accuracy on a
// held-out later window, sweeps the established K-factor, ablates the difficulty
// and margin extensions, and dumps a calibration curve + rating trajectories.
//
// Scope: declarer games only (Osnovno + Opravljanje) — the main skill signal.
// Klop/Renons/Radelci are structurally different and excluded here.
//
// Run:  node_modules/.bin/esbuild scripts/calibrate_ratings.ts --bundle \
//         --platform=node --format=esm --outfile=.calibrate.mjs && node .calibrate.mjs
// (or:  npm run calibrate)

import fs from 'fs';
import { list_room_ids, get_room, get_state } from '../src/lib/room_controler';
import { get_claims } from '../src/lib/claims';
import { get_account } from '../src/lib/auth';
import { game_made } from '../src/lib/stats';
import { round_teams } from '../src/lib/rating';
import {
  RoundType,
  NewRoundType,
  round_type_game,
  round_base_value,
  round_type_name,
  type GameRound,
  type NewRoundOsnovno,
} from '../src/lib/tarok';

const SCALE = 400;
const INITIAL = 1500;
const BASELINE = 1500;
const PROVISIONAL = 30;
const K_NEW = 40;
const P0_MIN = 0.05;
const P0_MAX = 0.95;
const PSEUDO = 10;
const WARMUP = 0.4; // first 40% of hands are warmup; evaluate on the rest

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const expected = (a: number, b: number, off = 0) => 1 / (1 + Math.pow(10, (b - a - off) / SCALE));

// ---- gather rooms (same shape as recompute_ratings) ----
interface RoomData {
  created: number;
  rounds: GameRound[];
  seat_account: (string | undefined)[];
}
const rooms: RoomData[] = [];
for (const id of list_room_ids()) {
  const room = get_room(id);
  if (room === undefined) continue;
  const state = get_state(id);
  const claims = get_claims(id);
  rooms.push({
    created: room.created ?? 0,
    rounds: state.rounds ?? [],
    seat_account: room.player_ids.map((pid) => claims[pid]),
  });
}

// ---- flatten declarer hands in chronological order ----
interface Hand {
  room: RoomData;
  round: GameRound;
  order: number;
}
const hands: Hand[] = [];
for (const room of rooms) {
  room.rounds.forEach((round) => {
    const kind = round_type_game(round.round_type);
    if (kind === NewRoundType.Osnovno || kind === NewRoundType.Opravljanje) {
      hands.push({ room, round, order: 0 });
    }
  });
}
hands.sort((a, b) => a.room.created - b.room.created);
hands.forEach((h, i) => (h.order = i));
const test_start = Math.floor(hands.length * WARMUP);

// ---- global difficulty priors (base rate per game type) ----
const made = new Map<RoundType, { made: number; total: number }>();
for (const { round } of hands) {
  const t = made.get(round.round_type) ?? { made: 0, total: 0 };
  t.total++;
  if (game_made(round)) t.made++;
  made.set(round.round_type, t);
}
const prior_of = (rt: RoundType) => {
  const t = made.get(rt);
  return clamp(t ? (t.made + 0.5 * PSEUDO) / (t.total + PSEUDO) : 0.5, P0_MIN, P0_MAX);
};
const offset_of = (rt: RoundType) => SCALE * Math.log10(prior_of(rt) / (1 - prior_of(rt)));
const base_rate = mean(hands.map((h) => (game_made(h.round) ? 1 : 0)));

function margin_weight(round: GameRound, gain: number): number {
  if (round_type_game(round.round_type) !== NewRoundType.Osnovno) return 1;
  const raw = round.round as Partial<NewRoundOsnovno> | undefined;
  if (raw === undefined || typeof raw.razlika !== 'string') return 1;
  const razlika = Math.abs(parseInt(raw.razlika.substring(1)));
  if (!Number.isFinite(razlika)) return 1;
  const norm = razlika / (round_base_value(round.round_type) || 10);
  return clamp(1 + gain * Math.log1p(norm), 0.7, 1.8);
}

interface Config {
  k: number;
  ratings: boolean; // use rating info in the prediction
  diff: boolean; // shift expectation by difficulty prior
  margin: number; // margin gain (0 disables)
}

interface Pred {
  p: number;
  y: number;
  test: boolean;
}

function replay(cfg: Config): { preds: Pred[]; traj: Map<string, { order: number; r: number }[]> } {
  const R = new Map<string, { r: number; g: number }>();
  const acc = (id: string) => {
    let v = R.get(id);
    if (v === undefined) R.set(id, (v = { r: INITIAL, g: 0 }));
    return v;
  };
  const rating_of = (room: RoomData, seat: number) => {
    const id = room.seat_account[seat];
    return id ? acc(id).r : BASELINE;
  };
  const preds: Pred[] = [];
  const traj = new Map<string, { order: number; r: number }[]>();

  for (const { room, round, order } of hands) {
    const teams = round_teams(round);
    if (teams === null || teams.active.length === 0 || teams.passive.length === 0) continue;
    const y = game_made(round) ? 1 : 0;
    const avg_a = mean(teams.active.map((i) => rating_of(room, i)));
    const avg_b = mean(teams.passive.map((i) => rating_of(room, i)));

    const p = cfg.ratings
      ? expected(avg_a, avg_b, cfg.diff ? offset_of(round.round_type) : 0)
      : cfg.diff
      ? prior_of(round.round_type)
      : base_rate;
    preds.push({ p, y, test: order >= test_start });

    if (cfg.ratings) {
      const w = cfg.margin > 0 ? margin_weight(round, cfg.margin) : 1;
      const e_a = p;
      for (const seat of teams.active) {
        const id = room.seat_account[seat];
        if (id === undefined) continue;
        const v = acc(id);
        const k = v.g < PROVISIONAL ? K_NEW : cfg.k;
        v.r += k * w * (y - e_a);
        v.g += 1;
        (traj.get(id) ?? traj.set(id, []).get(id)!).push({ order, r: v.r });
      }
      for (const seat of teams.passive) {
        const id = room.seat_account[seat];
        if (id === undefined) continue;
        const v = acc(id);
        const k = v.g < PROVISIONAL ? K_NEW : cfg.k;
        v.r += k * w * ((1 - y) - (1 - e_a));
        v.g += 1;
        (traj.get(id) ?? traj.set(id, []).get(id)!).push({ order, r: v.r });
      }
    }
  }
  return { preds, traj };
}

function metrics(preds: Pred[]) {
  const test = preds.filter((p) => p.test);
  let ll = 0;
  let brier = 0;
  let acc = 0;
  for (const { p, y } of test) {
    const q = clamp(p, 1e-9, 1 - 1e-9);
    ll += -(y * Math.log(q) + (1 - y) * Math.log(1 - q));
    brier += (p - y) ** 2;
    acc += (p >= 0.5 ? 1 : 0) === y ? 1 : 0;
  }
  const n = test.length;
  return { n, logloss: ll / n, brier: brier / n, acc: acc / n };
}

function calibration(preds: Pred[], bins = 10) {
  const b = Array.from({ length: bins }, () => ({ sp: 0, sy: 0, n: 0 }));
  for (const { p, y, test } of preds) {
    if (!test) continue;
    const i = Math.min(bins - 1, Math.floor(p * bins));
    b[i].sp += p;
    b[i].sy += y;
    b[i].n += 1;
  }
  return b
    .map((x, i) => ({
      bin: (i + 0.5) / bins,
      predicted: x.n ? x.sp / x.n : null,
      observed: x.n ? x.sy / x.n : null,
      count: x.n,
    }))
    .filter((x) => x.count > 0);
}

// ---- ablation models (all at K=20) ----
const ablations: { name: string; cfg: Config }[] = [
  { name: 'constant (base rate)', cfg: { k: 20, ratings: false, diff: false, margin: 0 } },
  { name: 'prior only (difficulty)', cfg: { k: 20, ratings: false, diff: true, margin: 0 } },
  { name: 'elo only', cfg: { k: 20, ratings: true, diff: false, margin: 0 } },
  { name: 'elo + difficulty', cfg: { k: 20, ratings: true, diff: true, margin: 0 } },
  { name: 'elo + difficulty + margin', cfg: { k: 20, ratings: true, diff: true, margin: 0.5 } },
];
const ablation_rows = ablations.map(({ name, cfg }) => ({ name, ...metrics(replay(cfg).preds) }));

// ---- K sweep (production model: ratings + difficulty, margin off) ----
const ks = [8, 10, 12, 14, 16, 20, 24, 28, 32, 40];
const k_sweep = ks.map((k) => ({
  k,
  ...metrics(replay({ k, ratings: true, diff: true, margin: 0 }).preds),
}));

// ---- before/after the applied tuning ----
const production = {
  old: metrics(replay({ k: 20, ratings: true, diff: true, margin: 0.5 }).preds),
  new: metrics(replay({ k: 12, ratings: true, diff: true, margin: 0 }).preds),
};

// ---- calibration curve + trajectories for the shipped config (K=12, margin off) ----
const prod = replay({ k: 12, ratings: true, diff: true, margin: 0 });
const calib = calibration(prod.preds);

// downsample trajectories to ~120 points each, resolve display names
const trajectories = [...prod.traj.entries()]
  .filter(([, pts]) => pts.length >= PROVISIONAL)
  .map(([id, pts]) => {
    const step = Math.max(1, Math.floor(pts.length / 120));
    const sampled = pts.filter((_, i) => i % step === 0 || i === pts.length - 1);
    return {
      name: get_account(id)?.display_name ?? '?',
      games: pts.length,
      points: sampled.map((p) => ({ order: p.order, r: Math.round(p.r) })),
    };
  })
  .sort((a, b) => b.games - a.games);

const priors = [...made.entries()]
  .map(([rt, t]) => ({
    name: round_type_name(rt),
    base_value: round_base_value(rt),
    prior: prior_of(rt),
    raw: t.made / t.total,
    sample: t.total,
  }))
  .sort((a, b) => b.prior - a.prior);

const out = {
  summary: {
    total_declarer_hands: hands.length,
    test_hands: hands.length - test_start,
    warmup: WARMUP,
    base_rate,
  },
  ablation: ablation_rows,
  production,
  k_sweep,
  calibration: calib,
  priors,
  trajectories,
};

fs.writeFileSync('.calibration.json', JSON.stringify(out, null, 2));

// ---- console report ----
const f = (x: number) => x.toFixed(4);
console.log(`\nDeclarer hands: ${hands.length}  (test window: ${out.summary.test_hands}, base rate: ${f(base_rate)})\n`);
console.log('Ablation (test log-loss / Brier / accuracy):');
for (const r of ablation_rows) console.log(`  ${r.name.padEnd(28)} ll=${f(r.logloss)}  brier=${f(r.brier)}  acc=${f(r.acc)}`);
console.log('\nK sweep (full model):');
for (const r of k_sweep) console.log(`  K=${String(r.k).padStart(2)}  ll=${f(r.logloss)}  brier=${f(r.brier)}  acc=${f(r.acc)}`);
const best = [...k_sweep].sort((a, b) => a.logloss - b.logloss)[0];
console.log(`\nBest K by log-loss: ${best.k} (ll=${f(best.logloss)})`);
console.log('\nApplied tuning (before → after):');
console.log(`  old  K=20, margin on   ll=${f(production.old.logloss)}  brier=${f(production.old.brier)}  acc=${f(production.old.acc)}`);
console.log(`  new  K=12, margin off  ll=${f(production.new.logloss)}  brier=${f(production.new.brier)}  acc=${f(production.new.acc)}`);
const impr = ((production.old.logloss - production.new.logloss) / production.old.logloss) * 100;
console.log(`  log-loss improvement: ${impr.toFixed(1)}%`);
console.log('\nWrote .calibration.json');
