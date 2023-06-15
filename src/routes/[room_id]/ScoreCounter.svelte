<script lang="ts">
  import { CardType, Realizacija, card_value } from '$lib/tarok';
  import img_pagat from '$lib/images/pagat.webp';
  import img_mond from '$lib/images/mond.webp';
  import img_skis from '$lib/images/skis.webp';
  import img_kralj from '$lib/images/kralj.webp';
  import img_baba from '$lib/images/baba.webp';
  import img_kaval from '$lib/images/kaval.webp';
  import img_fant from '$lib/images/fant.webp';
  import img_platelctarok from '$lib/images/platelctarok.webp';

  let cards = [] as string[];
  let _points = 0;
  let card_stack = [] as CardType[];
  export let points: number;
  export let razlika: string;
  export let kralji: Realizacija;
  export let trula: Realizacija;

  $: points = Math.round(_points);
  $: razlika = points_delta(_points);
  $: kralji = king_realization(counts.king);
  $: trula = trula_realization(counts.pagat, counts.mond, counts.skis);

  interface Counts {
    pagat: number;
    mond: number;
    skis: number;
    king: number;
    queen: number;
    horse: number;
    knight: number;
    one: number;
  }

  let counts = {
    pagat: 0,
    mond: 0,
    skis: 0,
    king: 0,
    queen: 0,
    horse: 0,
    knight: 0,
    one: 0,
  } as Counts;
  function reset_count() {
    _points = 0;
    cards = [];
    card_stack = [];
    counts.pagat = 0;
    counts.mond = 0;
    counts.skis = 0;
    counts.king = 0;
    counts.queen = 0;
    counts.horse = 0;
    counts.knight = 0;
    counts.one = 0;
  }

  function undo_count() {
    const last_card = card_stack.pop();
    if (last_card === undefined) return;
    _points -= card_value(last_card) - 2 / 3;
    cards = [...cards.slice(0, cards.length - 1)];
    switch (last_card) {
      case CardType.Pagat:
        counts.pagat--;
        break;
      case CardType.Mond:
        counts.mond--;
        break;
      case CardType.Skis:
        counts.skis--;
        break;
      case CardType.King:
        counts.king--;
        break;
      case CardType.Queen:
        counts.queen--;
        break;
      case CardType.Horse:
        counts.horse--;
        break;
      case CardType.Knight:
        counts.knight--;
        break;
      case CardType.One:
        counts.one--;
        break;
    }
  }

  function count_card(card: CardType) {
    let card_name = '';
    let card_source = '';
    switch (card) {
      case CardType.Pagat:
        counts.pagat++;
        card_source = img_pagat;
        card_name = 'I';
        break;
      case CardType.Mond:
        counts.mond++;
        card_source = img_mond;
        card_name = 'XXI';
        break;
      case CardType.Skis:
        counts.skis++;
        card_source = img_skis;
        card_name = 'ŠK';
        break;
      case CardType.King:
        counts.king++;
        card_source = img_kralj;
        card_name = `K${counts.king}`;
        break;
      case CardType.Queen:
        counts.queen++;
        card_source = img_baba;
        card_name = `Q${counts.queen}`;
        break;
      case CardType.Horse:
        counts.horse++;
        card_source = img_kaval;
        card_name = `C${counts.horse}`;
        break;
      case CardType.Knight:
        counts.knight++;
        card_source = img_fant;
        card_name = `J${counts.knight}`;
        break;
      case CardType.One:
        counts.one++;
        card_source = img_platelctarok;
        card_name = `T`;
        break;
    }

    _points += card_value(card) - 2 / 3;

    let new_card = `<img class="w-10 inline-block" src="${card_source}" alt="${card_name}" />`;
    // Add new card to display
    cards = [...cards, new_card];
    card_stack.push(card);
  }

  function points_delta(points: number) {
    points = Math.round(points);
    let difference = points - 35;
    let rounded_points = Math.floor((Math.abs(difference) + 2) / 5) * 5;

    return `${difference < 0 ? '-' : '+'}${rounded_points}`;
  }

  function king_realization(king_count: number) {
    switch (king_count) {
      case 0:
        return Realizacija.Izgubljena;
      case 4:
        return Realizacija.Narejena;
    }
    return Realizacija.Brez;
  }

  function realizacija_status(realizacija: Realizacija) {
    switch (realizacija) {
      case Realizacija.Izgubljena:
        return 'V drugem kupčku';
      case Realizacija.Narejena:
        return 'V tem kupčku';
    }
    return '';
  }

  function trula_realization(pagat: number, mond: number, skis: number) {
    let trula_count = pagat + mond + skis;
    switch (trula_count) {
      case 0:
        return Realizacija.Izgubljena;
      case 3:
        return Realizacija.Narejena;
    }
    return Realizacija.Brez;
  }

  function get_error_message(counts: Counts) {
    let message = '';
    message += counts.pagat > 1 ? 'Več kot en pagat!<br />' : '';
    message += counts.mond > 1 ? 'Več kot en mond!<br />' : '';
    message += counts.skis > 1 ? 'Več kot en škis!<br />' : '';
    message += counts.king > 4 ? 'Več kot štirje kralji!<br />' : '';
    message += counts.queen > 4 ? 'Več kot štiri kraljice!<br />' : '';
    message += counts.horse > 4 ? 'Več kot štiri kavalji!<br />' : '';
    message += counts.knight > 4 ? 'Več kot štiri fanti!<br />' : '';
    message += counts.one > 35 ? 'Več kot 35 platelcev in tarokov!<br />' : '';
    return message;
  }
</script>

<div class="p-4 space-y-4">
  <div class="btn-group variant-soft w-full">
    <button class="w-1/4" on:click={reset_count}>Ponastavi</button>
    <button class="w-3/4" on:click={undo_count}>Razveljavi</button>
  </div>
  <br />
  <div class="btn-group variant-filled-primary w-full">
    <button class="w-1/3" on:click={() => count_card(CardType.Pagat)}>Pagat</button>
    <button class="w-1/3" on:click={() => count_card(CardType.Mond)}>Mond</button>
    <button class="w-1/3" on:click={() => count_card(CardType.Skis)}>Škis</button>
  </div>
  <br />
  <div class="btn-group variant-filled-primary w-full">
    <button class="w-1/4" on:click={() => count_card(CardType.King)}>Kralj</button>
    <button class="w-1/4" on:click={() => count_card(CardType.Queen)}>Kraljica</button>
    <button class="w-1/4" on:click={() => count_card(CardType.Horse)}>Kavalj</button>
    <button class="w-1/4" on:click={() => count_card(CardType.Knight)}>Fant</button>
  </div>
  <br />
  <div class="btn-group variant-filled-primary flex justify-center">
    <button class="w-full" on:click={() => count_card(CardType.One)}>Platelc/Tarok</button>
  </div>
</div>

{#if get_error_message(counts) !== ''}
  <aside class="alert variant-filled-error h-max-fit">
    <div class="alert-message">
      <!-- eslint-disable-next-line svelte/no-at-html-tags-->
      <h2 class="h2">{@html get_error_message(counts)}</h2>
    </div>
  </aside>
{/if}

<div />

<div class="flex justify-between gap-4 p-4">
  <div>
    <table>
      <tr>
        <td>Točke</td><td><div class="badge variant-filled-primary">{points}</div></td>
      </tr>
      <tr>
        <td>Razlika</td><td
          ><div class="badge variant-filled-primary" class:variant-filled-error={points - 35 < 0}>{razlika}</div>
          ({points - 35})</td
        >
      </tr>
      <tr>
        <td>Kralji</td><td>{realizacija_status(kralji)}</td>
      </tr>
      <tr>
        <td>Trula</td><td>{realizacija_status(trula)}</td>
      </tr>
    </table>
  </div>

  <div>
    {#each cards as card, i}
      <!-- eslint-disable-next-line svelte/no-at-html-tags-->
      {@html card}
      {#if (i + 1) % 3 == 0 && i > 0}
        <br />
      {/if}
    {/each}
  </div>
</div>
