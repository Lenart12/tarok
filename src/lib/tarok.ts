export interface GameRoom {
    id: string,
    title: string,
    created: number,
    player_names: string[],
}

export enum RoundType {
    Rocno,
    Renons,
    Klop,
    Tri,         // 10
    Dva,         // 20
    Ena,         // 30
    Pikolo,      // 35
    SoloTri,     // 40
    SoloDva,     // 50
    SoloEna,     // 60
    Berac,       // 70
    SoloBrez,    // 80
    OdprtiBerac, // 90
    BarvniValat, // 125
    Valat,       // 500
}

export interface GameRound {
    round_type: RoundType,
    primary_player: number,
    points_change: number[],
    radelc_change: number[],
}

export interface NewRoundRocno {
    points_change: number[],
    radelc_change: number[],
}

export interface NewRoundKlop {
    points: number[]
}

export enum Realizacija {
    Narejena,
    Brez,
    Izgubljena,
}

export interface NewRoundOsnovno {
    razlika: number,
    rufan_igralec?: number
    kralji: Realizacija,
    trula: Realizacija,
    kralj_ultimo: Realizacija,
    pagat_ultimo: Realizacija,
    mondfang?: number, 
}

export interface NewRoundOpravljanje {
    opravljeno: boolean
}

export enum NewRoundType {
    Rocno,
    Renons,
    Osnovno,
    Klop,
    Opravljanje,
}

export interface NewRoundSettings {
    round_type: RoundType,
    player: number,
    rocno: NewRoundRocno,
    osnovno: NewRoundOsnovno,
    klop: NewRoundKlop,
    opravljanje: NewRoundOpravljanje,
}

export interface GameState {
    mixer: number,
    rounds: GameRound[]
    new_round: NewRoundSettings
}

export enum CardType {
    Pagat,
    Mond,
    Skis,
    King,
    Queen,
    Horse,
    Knight,
    One
}

export function card_value(card: CardType) {
    switch(card) {
        case CardType.Pagat:
        case CardType.Mond:
        case CardType.Skis:
        case CardType.King:
            return 5;
        case CardType.Queen: return 4;
        case CardType.Horse: return 3;
        case CardType.Knight: return 2;
        case CardType.One: return 1;
    }
}

export function round_type_shorthand(round_type: RoundType) {
    switch (round_type) {
        case RoundType.Rocno: return '';
        case RoundType.Renons: return 'R';
        case RoundType.Klop: return 'K';
        case RoundType.Tri: return '3';
        case RoundType.Dva: return '2';
        case RoundType.Ena: return '1';
        case RoundType.Pikolo: return 'P';
        case RoundType.SoloTri: return 'S3';
        case RoundType.SoloDva: return 'S2';
        case RoundType.SoloEna: return 'S1';
        case RoundType.Berac: return 'B';
        case RoundType.SoloBrez: return 'SB';
        case RoundType.OdprtiBerac: return 'OB';
        case RoundType.BarvniValat: return 'BV';
        case RoundType.Valat: return 'V';
    }
}

export function round_type_game(round_type: RoundType) {
    switch (round_type) {
        case RoundType.Rocno:
            return NewRoundType.Rocno
        case RoundType.Renons:
            return NewRoundType.Renons
        case RoundType.Klop:
            return NewRoundType.Klop
        case RoundType.Pikolo:
        case RoundType.Berac:
        case RoundType.OdprtiBerac:
        case RoundType.BarvniValat:
        case RoundType.Valat:
            return NewRoundType.Opravljanje
        case RoundType.Tri:
        case RoundType.Dva:
        case RoundType.Ena:
        case RoundType.SoloTri:
        case RoundType.SoloDva:
        case RoundType.SoloEna:
        case RoundType.SoloBrez:
            return NewRoundType.Osnovno
    }
}

export function round_radelc_increase(round_type: RoundType) {
    switch (round_type) {
        case RoundType.Klop:
        case RoundType.Pikolo:
        case RoundType.Berac:
        case RoundType.OdprtiBerac:
        case RoundType.BarvniValat:
        case RoundType.Valat:
        case RoundType.SoloBrez:
            return 1
        default:
            return 0
    }
}

export function game_is_solo(player_count: number, round_type: RoundType) {
    switch (round_type) {
        case RoundType.Tri:
        case RoundType.Dva:
        case RoundType.Ena:
            return player_count === 3;
        default:
            return true
    }
}

export function create_default_new_round_settings(player_count: number) {
    const settings = {
        round_type: RoundType.Dva,
        player: 0,
        rocno: {
            points_change: new Array(player_count).fill(0),
            radelc_change: new Array(player_count).fill(0)
        },
        osnovno: {
            razlika: 0,
            rufan_igralec: undefined,
            kralji: Realizacija.Brez,
            trula: Realizacija.Brez,
            kralj_ultimo: Realizacija.Brez,
            pagat_ultimo: Realizacija.Brez,
            mondfang: undefined
        },
        klop: {
            points: new Array(player_count).fill(0)
        },
        opravljanje: {
            opravljeno: false
        }
    } as NewRoundSettings
    return settings
}

export function round_base_value(round_type: RoundType) {
    switch (round_type) {
        case RoundType.Rocno: return 0
        case RoundType.Renons: return 0
        case RoundType.Klop: return 0
        case RoundType.Tri: return 10
        case RoundType.Dva: return 20
        case RoundType.Ena: return 30
        case RoundType.Pikolo: return 35
        case RoundType.SoloTri: return 40
        case RoundType.SoloDva: return 50
        case RoundType.SoloEna: return 60
        case RoundType.Berac: return 70
        case RoundType.SoloBrez: return 80
        case RoundType.OdprtiBerac: return 90
        case RoundType.BarvniValat: return 125
        case RoundType.Valat: return 500
    }
} 

export function evaluate_round(new_round: NewRoundSettings, radelci: number[]) {
    const round = {
        round_type: new_round.round_type,
        primary_player: new_round.player,
    } as GameRound;

    const player_count = new_round.rocno.points_change.length

    const evaluate_rocno = () => {
        round.points_change = structuredClone(new_round.rocno.points_change)
        round.radelc_change = structuredClone(new_round.rocno.radelc_change)
    }
    const evaluate_renons = () => {
        round.points_change = new Array(player_count).fill(0)
        round.radelc_change = new Array(player_count).fill(0)
        round.points_change[new_round.player] -= 70

        // if (radelci[new_round.player] > 0)
        //    round.points_change[new_round.player] *= 2
    }
    const evaluate_osnovno = () => {
        const {razlika,rufan_igralec,kralji,trula,kralj_ultimo,pagat_ultimo,mondfang} = new_round.osnovno

        let game_value = round_base_value(new_round.round_type)
        game_value += Math.abs(razlika)
        if (razlika < 0) game_value = -game_value

        switch (kralji) {
            case Realizacija.Narejena: game_value += 10; break;
            case Realizacija.Izgubljena: game_value -= 10; break;
        }
        switch (trula) {
            case Realizacija.Narejena: game_value += 10; break;
            case Realizacija.Izgubljena: game_value -= 10; break;
        }
        switch (kralj_ultimo) {
            case Realizacija.Narejena: game_value += 10; break;
            case Realizacija.Izgubljena: game_value -= 10; break;
        }
        switch (pagat_ultimo) {
            case Realizacija.Narejena: game_value += 25; break;
            case Realizacija.Izgubljena: game_value -= 25; break;
        }

        round.points_change = new Array(player_count).fill(0)

        round.points_change[new_round.player] = game_value

        console.log(rufan_igralec, !game_is_solo(player_count, new_round.round_type))
        if (rufan_igralec !== undefined && !game_is_solo(player_count, new_round.round_type)) {
            round.points_change[rufan_igralec] = game_value
        }

        if (mondfang !== undefined) {
            round.points_change[mondfang] -= 20
        }

        if (radelci[new_round.player] > 0)
            round.points_change = round.points_change.map(p => p * 2)

        const increase = round_radelc_increase(new_round.round_type)
        if (increase === 0) {
            round.radelc_change = new Array(player_count).fill(0)
            if (radelci[new_round.player] > 0 && razlika >= 0)
                round.radelc_change[new_round.player] = -1
        } else {
            round.radelc_change = new Array(player_count).fill(increase)
        }
    }
    const evaluate_klop = () => {
        const { points }  = new_round.klop

        round.points_change = new Array(player_count).fill(0)

        if (points.indexOf(0) !== -1) {
            round.points_change[points.indexOf(0)] = -70
        } else if (points.findIndex(p => p >= 35) !== -1) {
            round.points_change[points.findIndex(p => p >= 35)] = 70
        } else {
            round.points_change = points.map(p => -p)
        }

        round.points_change = round.points_change.map(
            (points, i) => radelci[i] > 0 ? -points * 2 : -points)
        round.radelc_change = new Array(player_count).fill(round_radelc_increase(new_round.round_type))
        round.primary_player = -1
    }
    const evaluate_opravljanje = () => {
        round.points_change = new Array(player_count).fill(0)
        round.points_change[new_round.player] = round_base_value(new_round.round_type) * (new_round.opravljanje.opravljeno ? 1 : -1)
        if (radelci[new_round.player] > 0)
            round.points_change[new_round.player] *= 2
        const increase = round_radelc_increase(new_round.round_type)
        if (increase === 0) {
            round.radelc_change = new Array(player_count).fill(0)
            if (radelci[new_round.player] > 0 && new_round.opravljanje.opravljeno)
                round.radelc_change[new_round.player] = -1
        } else {
            round.radelc_change = new Array(player_count).fill(increase)
        }
    }

    switch (round_type_game(round.round_type)) {
        case NewRoundType.Rocno: evaluate_rocno(); break;
        case NewRoundType.Renons: evaluate_renons(); break;
        case NewRoundType.Osnovno: evaluate_osnovno(); break;
        case NewRoundType.Klop: evaluate_klop(); break;
        case NewRoundType.Opravljanje: evaluate_opravljanje(); break;
    }

    return round
}