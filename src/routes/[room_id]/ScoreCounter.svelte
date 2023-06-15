<script lang="ts">
import { CardType, Realizacija, card_value } from "$lib/tarok";

let cards = [] as string[];
let _points = 0;
let card_stack = [] as CardType[];

export let points: number
export let razlika: string;
export let kralji: Realizacija;
export let trula: Realizacija;

$: points = Math.round(_points)
$: razlika = points_delta(_points)
$: kralji = king_realization(counts.king)
$: trula = trula_realization(counts.pagat, counts.mond, counts.skis)

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
    _points = 0
    cards = [];
    card_stack = [];
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
    const last_card = card_stack.pop();
    if (last_card === undefined) return;
    _points -= card_value(last_card) - 2/3
    cards = [...cards.slice(0, cards.length - 1)]
    switch(last_card) {
        case CardType.Pagat: counts.pagat--; break;
        case CardType.Mond: counts.mond--; break;
        case CardType.Skis: counts.skis--; break;
        case CardType.King: counts.king--; break;
        case CardType.Queen: counts.queen--; break;
        case CardType.Horse: counts.horse--; break;
        case CardType.Knight: counts.knight--; break;
        case CardType.One: counts.one--; break;
    }
}

function count_card(card: CardType) {
    let card_name = ''
    switch(card) {
        case CardType.Pagat:  counts.pagat++;  card_name = 'I'; break;
        case CardType.Mond:   counts.mond++;   card_name = 'XXI'; break;
        case CardType.Skis:   counts.skis++;   card_name = 'ŠK'; break;
        case CardType.King:   counts.king++;   card_name = `K${counts.king}`; break;
        case CardType.Queen:  counts.queen++;  card_name = `Q${counts.queen}`; break;
        case CardType.Horse:  counts.horse++;  card_name = `C${counts.horse}`; break;
        case CardType.Knight: counts.knight++; card_name = `J${counts.knight}`; break;
        case CardType.One:    counts.one++;    card_name = `T`; break;
    }

    _points += card_value(card) - 2/3

    // Add new card to display
    cards = [...cards, card_name];
    card_stack.push(card);
}

function points_delta(points: number) {
    points = Math.round(points)
    let difference = points - 35
    let rounded_points = Math.floor((Math.abs(difference) + 2) / 5) * 5

    return `${difference < 0 ? '-' : '+'}${rounded_points}`
}

function king_realization(king_count: number) {
    switch (king_count) {
        case 0: return Realizacija.Izgubljena;
        case 4: return Realizacija.Narejena;
    }
    return Realizacija.Brez
}

function realizacija_status(realizacija: Realizacija) {
    switch (realizacija) {
        case Realizacija.Izgubljena: return 'V drugem kupčku';
        case Realizacija.Narejena: return 'V tem kupčku';
    }
    return '';
}

function trula_realization(pagat: number, mond: number, skis: number) {
    let trula_count = pagat + mond + skis
    switch (trula_count) {
        case 0: return Realizacija.Izgubljena;
        case 3: return Realizacija.Narejena;
    }
    return Realizacija.Brez
}
</script>

<button on:click={reset_count}>Ponastavi</button>
<button on:click={undo_count}>Razveljavi</button>
<br><br>
<button on:click={() => count_card(CardType.Pagat)}>Pagat</button>
<button on:click={() => count_card(CardType.Mond)}>Mond</button>
<button on:click={() => count_card(CardType.Skis)}>Škis</button>
<br><br>
<button on:click={() => count_card(CardType.King)}>Kralj</button>
<button on:click={() => count_card(CardType.Queen)}>Kraljica</button>
<button on:click={() => count_card(CardType.Horse)}>Kavalj</button>
<button on:click={() => count_card(CardType.Knight)}>Fant</button>
<br><br>
<button on:click={() => count_card(CardType.One)}>Platelc/Tarok</button>

<div>
    {#each cards as card, i}
        {card}
        {#if (i + 1) % 3 == 0 && i > 0}
            <br>
        {/if}
    {/each}
</div>

<div class="error">
    <h2>{counts.pagat > 1 ? 'Več kot en pagat!' : ''}</h2>
    <h2>{counts.mond > 1 ? 'Več kot en mond!' : ''}</h2>
    <h2>{counts.skis > 1 ? 'Več kot en škis!' : ''}</h2>
    <h2>{counts.king > 4 ? 'Več kot štirje kralji!' : ''}</h2>
    <h2>{counts.queen > 4 ? 'Več kot štiri kraljice!' : ''}</h2>
    <h2>{counts.horse > 4 ? 'Več kot štiri kavalji!' : ''}</h2>
    <h2>{counts.knight > 4 ? 'Več kot štiri fanti!' : ''}</h2>
    <h2>{counts.one > 35 ? 'Več kot 35 platelcev in tarokov!' : ''}</h2>
</div>

<table>
    <tr>
        <td>Točke</td><td>{points}</td>
    </tr>
    <tr>
        <td>Razlika</td><td>{razlika} ({points - 35})</td>
    </tr>
    <tr>
        <td>Kralji</td><td>{realizacija_status(kralji)}</td>
    </tr>
    <tr>
        <td>Trula</td><td>{realizacija_status(trula)}</td>
    </tr>
</table>

<style>
    .error {
        background-color: red;
    }
</style>