export interface GameRoom {
  id: string;
  title: string;
  created: number;
  player_names: string[];
}

export enum RoundType {
  Rocno,
  Renons,
  Klop,
  Tri, // 10
  Dva, // 20
  Ena, // 30
  Pikolo, // 35
  SoloTri, // 40
  SoloDva, // 50
  SoloEna, // 60
  Berac, // 70
  SoloBrez, // 80
  OdprtiBerac, // 90
  BarvniValat, // 125
  Valat, // 500
}

export enum RadelcUsage {
  None,
  Used,
  NotUsed,
}


export interface GameRound {
  round_type: RoundType;
  primary_player: number;
  points_change: number[];
  radelc_change: number[];
  round: NewRoundRocno | NewRoundKlop | NewRoundOsnovno | NewRoundOpravljanje;
  koriscen_radelc: RadelcUsage[];
}

export interface NewRoundRocno {
  points_change: number[];
  radelc_change: number[];
}

export const klop_slider = ['Prazen', '0', '5', '10', '15', '20', '25', '30', '35', 'Poln'];
export interface NewRoundKlop {
  points: number[];
}

export enum Realizacija {
  Narejena,
  Brez,
  Izgubljena,
}

export enum NapovedBonusa {
  Brez,
  Napovedan,
}

export enum NapovedValata {
  Brez,
  NapovedanBarvni,
  NapovedanValat
}

export interface NewRoundOsnovnoNapoved {
  kralji: NapovedBonusa;
  trula: NapovedBonusa;
  kralj_ultimo: NapovedBonusa;
  pagat_ultimo: NapovedBonusa;
  valat: NapovedValata;
}

export interface NewRoundOsnovno {
  razlika: string;
  rufan_igralec?: number;
  napoved: NewRoundOsnovnoNapoved;
  kralji: Realizacija;
  trula: Realizacija;
  kralj_ultimo: Realizacija;
  pagat_ultimo: Realizacija;
  valat: Realizacija;
  mondfang?: number;
}

export interface NewRoundOpravljanje {
  opravljeno: boolean;
}

export enum NewRoundType {
  Rocno,
  Renons,
  Osnovno,
  Klop,
  Opravljanje,
}

export interface NewRoundSettings {
  round_type?: RoundType;
  player: number;
  mixer: number;
  rocno: NewRoundRocno;
  osnovno: NewRoundOsnovno;
  klop: NewRoundKlop;
  opravljanje: NewRoundOpravljanje;
}

export interface GameState {
  mixer: number;
  napovedi_open: boolean;
  obrazlozitev_open: boolean;
  rounds: GameRound[];
  new_round: NewRoundSettings;
}

export enum CardType {
  Pagat,
  Mond,
  Skis,
  King,
  Queen,
  Horse,
  Knight,
  One,
}

export function card_value(card: CardType) {
  switch (card) {
    case CardType.Pagat:
    case CardType.Mond:
    case CardType.Skis:
    case CardType.King:
      return 5;
    case CardType.Queen:
      return 4;
    case CardType.Horse:
      return 3;
    case CardType.Knight:
      return 2;
    case CardType.One:
      return 1;
  }
}

export function round_type_name(round_type: RoundType) {
  switch (round_type) {
    case RoundType.Rocno:
      return 'Ročni vpis';
    case RoundType.Renons:
      return 'RENONS';
    case RoundType.Klop:
      return 'Klop';
    case RoundType.Tri:
      return 'Igra v tri';
    case RoundType.Dva:
      return 'Igra v dva';
    case RoundType.Ena:
      return 'Igra v ena';
    case RoundType.Pikolo:
      return 'Pikolo';
    case RoundType.SoloTri:
      return 'Solo tri';
    case RoundType.SoloDva:
      return 'Solo dva';
    case RoundType.SoloEna:
      return 'Solo ena';
    case RoundType.Berac:
      return 'Berač';
    case RoundType.SoloBrez:
      return 'Solo brez';
    case RoundType.OdprtiBerac:
      return 'Odprti berač';
    case RoundType.BarvniValat:
      return 'Barvni valat';
    case RoundType.Valat:
      return 'Valat';
  }
}

export function round_type_shorthand(round_type: RoundType) {
  switch (round_type) {
    case RoundType.Rocno:
      return '';
    case RoundType.Renons:
      return 'R';
    case RoundType.Klop:
      return 'K';
    case RoundType.Tri:
      return '3';
    case RoundType.Dva:
      return '2';
    case RoundType.Ena:
      return '1';
    case RoundType.Pikolo:
      return 'P';
    case RoundType.SoloTri:
      return 'S3';
    case RoundType.SoloDva:
      return 'S2';
    case RoundType.SoloEna:
      return 'S1';
    case RoundType.Berac:
      return 'B';
    case RoundType.SoloBrez:
      return 'SB';
    case RoundType.OdprtiBerac:
      return 'OB';
    case RoundType.BarvniValat:
      return 'BV';
    case RoundType.Valat:
      return 'V';
  }
}

export function round_type_game(round_type: RoundType) {
  switch (round_type) {
    case RoundType.Rocno:
      return NewRoundType.Rocno;
    case RoundType.Renons:
      return NewRoundType.Renons;
    case RoundType.Klop:
      return NewRoundType.Klop;
    case RoundType.Pikolo:
    case RoundType.Berac:
    case RoundType.OdprtiBerac:
    case RoundType.BarvniValat:
    case RoundType.Valat:
      return NewRoundType.Opravljanje;
    case RoundType.Tri:
    case RoundType.Dva:
    case RoundType.Ena:
    case RoundType.SoloTri:
    case RoundType.SoloDva:
    case RoundType.SoloEna:
    case RoundType.SoloBrez:
      return NewRoundType.Osnovno;
  }
}

export function new_radelc_for_round(round_type: RoundType) {
  switch (round_type) {
    case RoundType.Klop:
    case RoundType.Pikolo:
    case RoundType.Berac:
    case RoundType.OdprtiBerac:
    case RoundType.BarvniValat:
    case RoundType.Valat:
    case RoundType.SoloBrez:
      return 1;
    default:
      return 0;
  }
}

export function game_is_solo(player_count: number, round_type: RoundType) {
  switch (round_type) {
    case RoundType.Tri:
    case RoundType.Dva:
    case RoundType.Ena:
      return player_count === 3;
    default:
      return true;
  }
}

function create_n_array_of<T>(n: number, i: T) {
  return new Array(n).fill(i);
}

export function create_default_new_round_settings(player_count: number) {
  const settings = {
    round_type: undefined,
    player: 0,
    rocno: {
      points_change: create_n_array_of(player_count, 0),
      radelc_change: create_n_array_of(player_count, 0),
    },
    osnovno: {
      razlika: '+0',
      rufan_igralec: undefined,
      napoved: {
        kralji: NapovedBonusa.Brez,
        trula: NapovedBonusa.Brez,
        kralj_ultimo: NapovedBonusa.Brez,
        pagat_ultimo: NapovedBonusa.Brez,
        valat: NapovedValata.Brez,
      },
      kralji: Realizacija.Brez,
      trula: Realizacija.Brez,
      kralj_ultimo: Realizacija.Brez,
      pagat_ultimo: Realizacija.Brez,
      valat: Realizacija.Brez,
      mondfang: undefined,
    },
    klop: {
      points: create_n_array_of(player_count, 0),
    },
    opravljanje: {
      opravljeno: false,
    },
  } as NewRoundSettings;
  return settings;
}

export function round_base_value(round_type: RoundType) {
  switch (round_type) {
    case RoundType.Rocno:
      return 0;
    case RoundType.Renons:
      return 0;
    case RoundType.Klop:
      return 0;
    case RoundType.Tri:
      return 10;
    case RoundType.Dva:
      return 20;
    case RoundType.Ena:
      return 30;
    case RoundType.Pikolo:
      return 35;
    case RoundType.SoloTri:
      return 40;
    case RoundType.SoloDva:
      return 50;
    case RoundType.SoloEna:
      return 60;
    case RoundType.Berac:
      return 70;
    case RoundType.SoloBrez:
      return 80;
    case RoundType.OdprtiBerac:
      return 90;
    case RoundType.BarvniValat:
      return 125;
    case RoundType.Valat:
      return 500;
  }
}

export function evaluate_round(new_round: NewRoundSettings, radelci: number[]) {
  if (new_round.round_type === undefined)
    throw "Evaluating a round without a type";

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const round_type = new_round.round_type!;

  const round = {
    round_type: round_type,
    primary_player: new_round.player,
  } as GameRound;

  const player_count = new_round.rocno.points_change.length;
  const ima_radelc = (player: number) => radelci[player] > 0;
  const is_not_playing = (player: number) => player_count > 4 && player === new_round.mixer;
  const realiziraj = (realizacija: Realizacija, napoved: NapovedBonusa, tocke: number) => {
    const je_napovedano = napoved === NapovedBonusa.Napovedan;
    switch (realizacija) {
      case Realizacija.Narejena:
        return je_napovedano ? tocke * 2 : tocke;
      case Realizacija.Brez:
        return je_napovedano ? -tocke : 0;
      case Realizacija.Izgubljena:
        return je_napovedano ? -tocke * 2 : -tocke;
    }
  };

  round.koriscen_radelc = create_n_array_of(player_count, RadelcUsage.None);

  const evaluate_rocno = () => {
    round.points_change = structuredClone(new_round.rocno.points_change);
    round.radelc_change = structuredClone(new_round.rocno.radelc_change);
    round.round = new_round.rocno;
  };
  const evaluate_renons = () => {
    round.points_change = create_n_array_of(player_count, 0);
    round.radelc_change = create_n_array_of(player_count, 0);
    round.points_change[new_round.player] -= 70;

    // if (radelci[new_round.player] > 0)
    //    round.points_change[new_round.player] *= 2
  };
  const evaluate_osnovno = () => {
    const { rufan_igralec, napoved, kralji, trula, kralj_ultimo, pagat_ultimo, valat, mondfang } = new_round.osnovno;

    round.points_change = create_n_array_of(player_count, 0);
    let game_value = 0;
    let igra_opravljena = false;
    let radelc_zaradi_valata = false;

    if (valat != Realizacija.Brez || napoved.valat !== NapovedValata.Brez) {
      igra_opravljena = valat === Realizacija.Narejena;
      game_value = napoved.valat == NapovedValata.NapovedanBarvni ? 125 : 250;
      radelc_zaradi_valata = napoved.valat !== NapovedValata.Brez;

      if (napoved.valat === NapovedValata.NapovedanValat) {
        game_value *= 2;
      }

      if (!igra_opravljena) {
        game_value = -game_value;
      }
    } else {
      const razlika_str = new_round.osnovno.razlika;
      igra_opravljena = razlika_str.startsWith('+');
      const razlika = parseInt(razlika_str.substring(1));

      game_value = round_base_value(round_type);
      game_value += razlika;
      if (!igra_opravljena) game_value = -game_value;

      game_value += realiziraj(kralji, napoved.kralji, 10);
      game_value += realiziraj(trula, napoved.trula, 10);
      game_value += realiziraj(kralj_ultimo, napoved.kralj_ultimo, 10);
      game_value += realiziraj(pagat_ultimo, napoved.pagat_ultimo, 25);
    }


    round.points_change[new_round.player] = game_value;
    if (rufan_igralec !== undefined && !game_is_solo(player_count, round_type)) {
      round.points_change[rufan_igralec] = game_value;
    }

    const novi_radelci = new_radelc_for_round(round_type) || (radelc_zaradi_valata ? 1 : 0);
    round.radelc_change = create_n_array_of(player_count, novi_radelci);

    if (ima_radelc(new_round.player)) {
      round.points_change = round.points_change.map((p) => p * 2);
      round.koriscen_radelc[new_round.player] = (igra_opravljena) ? RadelcUsage.Used : RadelcUsage.NotUsed;

      if (igra_opravljena) round.radelc_change[new_round.player] -= 1;
    }

    if (mondfang !== undefined) {
      round.points_change[mondfang] -= 20;
    }
    round.round = new_round.osnovno;
  };
  const evaluate_klop = () => {
    const { points } = new_round.klop;
    round.primary_player = -1;

    round.points_change = create_n_array_of(player_count, 0);
    round.radelc_change = create_n_array_of(player_count, new_radelc_for_round(round_type));

    const winners = points.reduce((w: number[], p, i) => {
      if (p === 0 && !is_not_playing(i)) w.push(i);
      return w;
    }, []);
    const losers = points.reduce((l: number[], p, i) => {
      if (p === 9 && !is_not_playing(i)) l.push(i);
      return l;
    }, []);

    if (winners.length !== 0 || losers.length !== 0) {
      winners.forEach((w) => {
        round.points_change[w] = 70;
        if (ima_radelc(w)) {
          round.radelc_change[w]--;
          round.koriscen_radelc[w] = RadelcUsage.Used;
        }
      });
      losers.forEach((l) => {
        round.points_change[l] = -70;
        round.koriscen_radelc[l] = RadelcUsage.NotUsed;
      });
    } else {
      round.points_change = points.map((p) => -Math.min(Math.max(0, p - 1), 7) * 5);
    }

    round.points_change = round.points_change.map((points, i) => (ima_radelc(i) ? points * 2 : points));
    round.round = new_round.klop;
  };
  const evaluate_opravljanje = () => {
    const { opravljeno } = new_round.opravljanje;

    round.points_change = create_n_array_of(player_count, 0);
    round.points_change[new_round.player] = round_base_value(round_type) * (opravljeno ? 1 : -1);

    const novi_radelci = new_radelc_for_round(round_type);
    round.radelc_change = create_n_array_of(player_count, novi_radelci);

    if (ima_radelc(new_round.player)) {
      round.points_change[new_round.player] *= 2;
      round.koriscen_radelc[new_round.player] = new_round.opravljanje.opravljeno ? RadelcUsage.Used : RadelcUsage.NotUsed;

      if (new_round.opravljanje.opravljeno) round.radelc_change[new_round.player] -= 1;
    }
    round.round = new_round.opravljanje;
  };

  switch (round_type_game(round_type)) {
    case NewRoundType.Rocno:
      evaluate_rocno();
      break;
    case NewRoundType.Renons:
      evaluate_renons();
      break;
    case NewRoundType.Osnovno:
      evaluate_osnovno();
      break;
    case NewRoundType.Klop:
      evaluate_klop();
      break;
    case NewRoundType.Opravljanje:
      evaluate_opravljanje();
      break;
  }

  return round;
}
