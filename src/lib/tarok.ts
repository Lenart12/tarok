export interface GameRoom {
    id: string,
    title: string,
    created: number,
    player_names: string[],
}

export interface GameRound {
    game_type: string,
    primary_player: number,
    secondary_player: number,
    points_change: number[],
    radelc_change: number[]
}

export interface GameState {
    mixer: number,
    rounds: GameRound[]
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