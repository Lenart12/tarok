import {
  RoundType,
  Realizacija,
  NapovedBonusa,
  NapovedValata,
  NewRoundType,
  round_type_name,
  round_type_game,
  game_is_solo,
  type GameRound,
  type NewRoundOsnovno,
  type NewRoundOpravljanje,
} from './tarok';

export interface GameTypeStat {
  round_type: RoundType;
  name: string;
  count: number;
  wins: number;
  losses: number;
  sum_points: number;
}

export interface BonusStat {
  name: string;
  count: number;
  wins: number;
  losses: number;
  sum_points: number;
}

export interface HandRef {
  room_id: string;
  title: string;
  round_index: number;
  points: number;
  round: GameRound;
  player_names: string[];
}

export interface PlayerStats {
  total_rounds: number;
  active: GameTypeStat[];
  passive: GameTypeStat[];
  active_summary: { rounds: number; wins: number; sum_points: number };
  passive_summary: { rounds: number; wins: number; sum_points: number };
  klicanje: {
    klical: number;
    poklican: number;
    solo: number;
    klical_wins: number;
    poklican_wins: number;
    solo_wins: number;
  };
  tihe: BonusStat[];
  izrecene: BonusStat[];
  mond_caught: number;
  points_by_type: { round_type: RoundType; name: string; points: number }[];
  histogram: { bucket: number; count: number }[];
  biggest_win: HandRef | null;
  biggest_loss: HandRef | null;
}

interface StatEntry {
  rounds: GameRound[];
  index: number;
  player_count: number;
  room_id: string;
  title: string;
  player_names: string[];
}

const HIST_BUCKET = 20;

// Legacy rooms may store rounds with a missing or malformed `round` payload, so
// every access is guarded and falls back to the sign of the declarer's points.
function game_made(round: GameRound): boolean {
  const kind = round_type_game(round.round_type);
  const r = round.round as Partial<NewRoundOpravljanje & NewRoundOsnovno> | undefined;
  if (kind === NewRoundType.Opravljanje && r !== undefined && typeof r.opravljeno === 'boolean') {
    return r.opravljeno;
  }
  if (kind === NewRoundType.Osnovno && r !== undefined && typeof r.razlika === 'string') {
    // Legacy rounds may omit the valat fields entirely; treat missing as Brez.
    const valat = r.valat ?? Realizacija.Brez;
    const napoved_valat = r.napoved?.valat ?? NapovedValata.Brez;
    if (valat !== Realizacija.Brez || napoved_valat !== NapovedValata.Brez) {
      return valat === Realizacija.Narejena;
    }
    return r.razlika.startsWith('+');
  }
  return (round.points_change?.[round.primary_player] ?? 0) > 0;
}

// Mirrors evaluate_round's realiziraj so bonus averages match the scoring engine.
function bonus_value(realizacija: Realizacija, napoved: NapovedBonusa, tocke: number): number {
  const je_napovedano = napoved === NapovedBonusa.Napovedan;
  switch (realizacija) {
    case Realizacija.Narejena:
      return je_napovedano ? tocke * 2 : tocke;
    case Realizacija.Brez:
      return je_napovedano ? -tocke : 0;
    case Realizacija.Izgubljena:
      return je_napovedano ? -tocke * 2 : -tocke;
  }
}

function get_type_stat(map: Map<RoundType, GameTypeStat>, rt: RoundType): GameTypeStat {
  let stat = map.get(rt);
  if (stat === undefined) {
    stat = { round_type: rt, name: round_type_name(rt), count: 0, wins: 0, losses: 0, sum_points: 0 };
    map.set(rt, stat);
  }
  return stat;
}

const BONUS_POINTS = { kralji: 10, trula: 10, kralj_ultimo: 10, pagat_ultimo: 25 } as const;
type SimpleBonusKey = keyof typeof BONUS_POINTS;
const SIMPLE_BONUS_KEYS: SimpleBonusKey[] = ['kralji', 'trula', 'kralj_ultimo', 'pagat_ultimo'];
const BONUS_NAMES = {
  kralji: 'Kralji',
  trula: 'Trula',
  kralj_ultimo: 'Kralj ultimo',
  pagat_ultimo: 'Pagat ultimo',
  valat: 'Valat',
} as const;
type BonusKey = keyof typeof BONUS_NAMES;
const BONUS_KEYS: BonusKey[] = ['kralji', 'trula', 'kralj_ultimo', 'pagat_ultimo', 'valat'];

function empty_bonus_map(): Map<BonusKey, BonusStat> {
  const map = new Map<BonusKey, BonusStat>();
  for (const key of BONUS_KEYS) {
    map.set(key, { name: BONUS_NAMES[key], count: 0, wins: 0, losses: 0, sum_points: 0 });
  }
  return map;
}

function add_bonus(stat: BonusStat, realizacija: Realizacija, points: number) {
  stat.count++;
  stat.sum_points += points;
  if (realizacija === Realizacija.Narejena) stat.wins++;
  else if (realizacija === Realizacija.Izgubljena) stat.losses++;
}

export function aggregate_stats(entries: StatEntry[]): PlayerStats {
  const active = new Map<RoundType, GameTypeStat>();
  const passive = new Map<RoundType, GameTypeStat>();
  const tihe = empty_bonus_map();
  const izrecene = empty_bonus_map();
  const klicanje = {
    klical: 0,
    poklican: 0,
    solo: 0,
    klical_wins: 0,
    poklican_wins: 0,
    solo_wins: 0,
  };
  const active_summary = { rounds: 0, wins: 0, sum_points: 0 };
  const passive_summary = { rounds: 0, wins: 0, sum_points: 0 };
  const points_by_type = new Map<RoundType, number>();
  const histogram = new Map<number, number>();
  let total_rounds = 0;
  let mond_caught = 0;
  let biggest_win: HandRef | null = null;
  let biggest_loss: HandRef | null = null;

  for (const { rounds, index: p, player_count, room_id, title, player_names } of entries) {
    for (let round_index = 0; round_index < rounds.length; round_index++) {
      const round = rounds[round_index];
      const rt = round.round_type;

      // Point source, histogram, record hands and mond track every round the player had a stake in.
      const my_points = round.points_change?.[p] ?? 0;
      points_by_type.set(rt, (points_by_type.get(rt) ?? 0) + my_points);
      if (my_points !== 0) {
        const bucket = Math.floor(my_points / HIST_BUCKET) * HIST_BUCKET;
        histogram.set(bucket, (histogram.get(bucket) ?? 0) + 1);
      }
      if ((round.round as Partial<NewRoundOsnovno> | undefined)?.mondfang === p) mond_caught++;
      if (biggest_win === null || my_points > biggest_win.points) {
        biggest_win = { room_id, title, round_index, points: my_points, round, player_names };
      }
      if (biggest_loss === null || my_points < biggest_loss.points) {
        biggest_loss = { room_id, title, round_index, points: my_points, round, player_names };
      }

      if (rt === RoundType.Rocno || rt === RoundType.Renons) continue;
      total_rounds++;

      if (rt === RoundType.Klop) {
        const points = round.points_change?.[p] ?? 0;
        const stat = get_type_stat(active, rt);
        stat.count++;
        stat.sum_points += points;
        if (points > 0) stat.wins++;
        else stat.losses++;
        active_summary.rounds++;
        active_summary.sum_points += points;
        if (points > 0) active_summary.wins++;
        continue;
      }

      const kind = round_type_game(rt);
      const raw = round.round as Partial<NewRoundOsnovno> | undefined;
      const osnovno =
        kind === NewRoundType.Osnovno && raw !== undefined && raw.napoved !== undefined
          ? (raw as NewRoundOsnovno)
          : undefined;
      const partner = osnovno?.rufan_igralec;
      const is_active = p === round.primary_player || (partner !== undefined && p === partner);
      const made = game_made(round);

      if (is_active) {
        const points = round.points_change?.[p] ?? 0;
        const stat = get_type_stat(active, rt);
        stat.count++;
        stat.sum_points += points;
        if (made) stat.wins++;
        else stat.losses++;
        active_summary.rounds++;
        active_summary.sum_points += points;
        if (made) active_summary.wins++;

        // King-calling: only relevant in game types that normally have a called partner.
        if (osnovno !== undefined && !game_is_solo(player_count, rt)) {
          if (p === round.primary_player) {
            // Declarer went alone (held the called king) instead of calling a partner.
            if (partner === undefined) {
              klicanje.solo++;
              if (made) klicanje.solo_wins++;
            } else {
              klicanje.klical++;
              if (made) klicanje.klical_wins++;
            }
          } else {
            klicanje.poklican++;
            if (made) klicanje.poklican_wins++;
          }
        }

        // Announcement/silent bonus stats attributed to the active team.
        if (osnovno !== undefined) {
          for (const key of SIMPLE_BONUS_KEYS) {
            const real = osnovno[key];
            if (real === undefined || real === Realizacija.Brez) continue;
            const napoved = osnovno.napoved[key];
            const announced = napoved === NapovedBonusa.Napovedan;
            const points = bonus_value(real, napoved, BONUS_POINTS[key]);
            add_bonus((announced ? izrecene : tihe).get(key) as BonusStat, real, points);
          }
          const valat_announced = (osnovno.napoved.valat ?? NapovedValata.Brez) !== NapovedValata.Brez;
          if ((osnovno.valat !== undefined && osnovno.valat !== Realizacija.Brez) || valat_announced) {
            const base = osnovno.napoved.valat === NapovedValata.NapovedanBarvni ? 125 : 250;
            const points =
              osnovno.valat === Realizacija.Narejena ? base : osnovno.valat === Realizacija.Izgubljena ? -base : 0;
            add_bonus((valat_announced ? izrecene : tihe).get('valat') as BonusStat, osnovno.valat, points);
          }
        }
      } else if (player_count <= 4 || p !== round.primary_player) {
        // Passive (defending) team: declarer game the player did not lead.
        const declarer_points = round.points_change?.[round.primary_player] ?? 0;
        const points = -declarer_points;
        const stat = get_type_stat(passive, rt);
        stat.count++;
        stat.sum_points += points;
        if (!made) stat.wins++;
        else stat.losses++;
        passive_summary.rounds++;
        passive_summary.sum_points += points;
        if (!made) passive_summary.wins++;
      }
    }
  }

  const to_sorted = (map: Map<RoundType, GameTypeStat>) =>
    [...map.values()].sort((a, b) => b.count - a.count);
  const bonus_list = (map: Map<BonusKey, BonusStat>) =>
    BONUS_KEYS.map((k) => map.get(k) as BonusStat).filter((s) => s.count > 0);

  const points_by_type_list = [...points_by_type.entries()]
    .filter(([, points]) => points !== 0)
    .map(([round_type, points]) => ({ round_type, name: round_type_name(round_type), points }))
    .sort((a, b) => Math.abs(b.points) - Math.abs(a.points));

  const histogram_list = [...histogram.entries()]
    .map(([bucket, count]) => ({ bucket, count }))
    .sort((a, b) => a.bucket - b.bucket);

  return {
    total_rounds,
    active: to_sorted(active),
    passive: to_sorted(passive),
    active_summary,
    passive_summary,
    klicanje,
    tihe: bonus_list(tihe),
    izrecene: bonus_list(izrecene),
    mond_caught,
    points_by_type: points_by_type_list,
    histogram: histogram_list,
    biggest_win,
    biggest_loss,
  };
}
