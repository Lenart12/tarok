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