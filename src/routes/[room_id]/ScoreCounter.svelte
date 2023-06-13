<script lang="ts">

export let points = 0;
export let cards = [] as string[];
let saved_points = [] as number[];

let counts = {
    pagat: 0,
    mond: 0,
    skis: 0,
    king: 0,
    queen: 0,
    horse: 0,
    knight: 0,
    one: 0
}
function reset_count() {
    points = 0
    cards = []
    counts.pagat = 0
    counts.mond = 0
    counts.skis = 0
    counts.king = 0
    counts.queen = 0
    counts.horse = 0
    counts.knight = 0
    counts.one = 0
}

function undo_count() {
    const last_card = saved_points.pop();
    if (last_card === undefined) return;
    points -= last_card - 2/3
    cards = [...cards.slice(0, cards.length - 1)]
}

function save_card(card_name: string) {
    cards = [...cards, card_name]
}

function count_points(card_value: number) {
    saved_points.push(card_value)
    points += card_value - 2/3
}

function count_pagat()  {counts.pagat++;  save_card('I');                 count_points(5)}
function count_mond()   {counts.mond++;   save_card('XXI');               count_points(5)}
function count_skis()   {counts.skis++;   save_card('ŠK');                count_points(5)}
function count_king()   {counts.king++;   save_card(`K${counts.king}`);   count_points(5)}
function count_queen()  {counts.queen++;  save_card(`Q${counts.queen}`);  count_points(4)}
function count_horse()  {counts.horse++;  save_card(`C${counts.horse}`);  count_points(3)}
function count_knight() {counts.knight++; save_card(`P${counts.knight}`); count_points(2)}
function count_one()    {counts.one++;    save_card(`T`);                 count_points(1)}

function points_delta(points: number) {
    points = Math.round(points)
    let difference = points - 35
    let rounded_points = Math.floor((Math.abs(difference) + 2) / 5) * 5

    return `${difference < 0 ? '-' : '+'}${rounded_points} (${difference})`
}

function king_status() {
    switch (counts.king) {
        case 0: return 'V drugem kupčku';
        case 4: return 'V tem kupčku';
    }
    return '';
}
function trula_status() {
    let trula_count = counts.pagat + counts.mond + counts.skis
    switch (trula_count) {
        case 0: return 'V drugem kupčku';
        case 3: return 'V tem kupčku';
    }
    return '';
}
</script>

<button on:click={reset_count}>Ponastavi</button>
<button on:click={undo_count}>Razveljavi</button>
<br><br>
<button on:click={count_pagat}>Pagat</button>
<button on:click={count_mond}>Mond</button>
<button on:click={count_skis}>Škis</button>
<br><br>
<button on:click={count_king}>Kralj</button>
<button on:click={count_queen}>Kraljica</button>
<button on:click={count_horse}>Kavalj</button>
<button on:click={count_knight}>Fant</button>
<br><br>
<button on:click={count_one}>Platelc/Tarok</button>

<div>
    {#each cards as card, i}
        {card}
        {#if (i + 1) % 3 == 0 && i > 0}
            <br>
        {/if}
    {/each}
</div>

<table>
    <tr>
        <td>Točke</td><td>{Math.round(points)}</td>
    </tr>
    <tr>
        <td>Razlika</td><td>{points_delta(points)}</td>
    </tr>
    <tr>
        <td>Kralji</td><td>{points === 0 ? '' : king_status()}</td>
    </tr>
    <tr>
        <td>Trula</td><td>{points === 0 ? '' : trula_status()}</td>
    </tr>
</table>