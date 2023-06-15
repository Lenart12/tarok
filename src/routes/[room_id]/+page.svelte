<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount, onDestroy } from 'svelte';
  import { io } from '$lib/game_connection_client';
  import ScoreCounter from './ScoreCounter.svelte';
  import {
    NewRoundType,
    Realizacija,
    RoundType,
    create_default_new_round_settings,
    evaluate_round,
    game_is_solo,
    round_type_game,
    round_type_shorthand,
  } from '$lib/tarok';
  import type { GameState } from '$lib/tarok';
  import QRCode from 'qrcode';
  import InputRealizacija from './InputRealizacija.svelte';

  export let data;

  const player_count = data.room.player_names.length;
  let radelc_total = [] as number[];
  let points_total = [] as number[];

  let game_state: GameState | undefined = undefined;
  let old_game_state: GameState | undefined = undefined;

  onMount(async () => {
    const rooms = JSON.parse(localStorage.getItem('rooms') || '[]') as string[];
    if (rooms.indexOf(data.room.id) === -1) rooms.push(data.room.id);
    localStorage.setItem('rooms', JSON.stringify(rooms));

    const on_connected = () => {
      console.log('WS connected, joined room', data.room.id);
      io.emit('tarok:join-room', data.room.id);
    };

    if (io.connected) on_connected();
    io.on('connect', on_connected);
    io.on('reconnect', on_connected);
    io.on('disconnect', () => (game_state = undefined));
    io.on('tarok:new-state', (new_state) => {
      // console.log('WS New state', new_state)
      old_game_state = structuredClone(new_state);
      game_state = new_state;
      draw_updated_state();
    });

    QRCode.toCanvas(document.getElementById('invite_qr'), window.location.toString());
  });

  onDestroy(() => {
    if (browser) {
      io.emit('tarok:leave-room', data.room.id);
      io.removeAllListeners();
    }
  });

  const razlika_slider = [
    '-35',
    '-30',
    '-25',
    '-20',
    '-15',
    '-10',
    '-5',
    '-0',
    '+0',
    '+5',
    '+10',
    '+15',
    '+20',
    '+25',
    '+30',
    '+35',
  ];
  let razlika_slider_value: number;
  let counter_points: number;
  let counter_razlika: string;
  let counter_kings: Realizacija;
  let counter_trula: Realizacija;

  function update_scoreboard_total() {
    const radelc = [...new Array(player_count)].fill(0);
    const points = [...new Array(player_count)].fill(0);

    game_state?.rounds.forEach((round) => {
      radelc.forEach((rad, i) => (radelc[i] = rad + round.radelc_change[i]));
      points.forEach((rad, i) => (points[i] = rad + round.points_change[i]));
    });

    radelc_total = radelc;
    points_total = points;
  }

  function update_state() {
    if (game_state === undefined || JSON.stringify(game_state) === JSON.stringify(old_game_state)) return;
    old_game_state = structuredClone(game_state);
    io.emit('tarok:update-state', game_state, data.room.id);
    draw_updated_state();
  }

  function primary_player_changed() {
    if (game_state === undefined) return;
    if (game_state.new_round.player === game_state.new_round.osnovno.rufan_igralec)
      game_state.new_round.osnovno.rufan_igralec = undefined;
  }

  function mixer_left() {
    if (game_state === undefined) return;
    game_state.mixer--;
    if (game_state.mixer < 0) game_state.mixer = player_count - 1;
  }

  function mixer_right() {
    if (game_state === undefined) return;
    game_state.mixer++;
    if (game_state.mixer >= player_count) game_state.mixer = 0;
  }

  function submit_round() {
    if (game_state === undefined) return;
    game_state.rounds.push(evaluate_round(game_state.new_round, radelc_total));
    game_state.new_round = create_default_new_round_settings(player_count);
    mixer_right();
    document.getElementById('scoreboard')?.scrollIntoView({ behavior: 'smooth' });
  }

  function undo_round() {
    if (game_state === undefined || game_state.rounds.length === 0) return;
    game_state.rounds = [...game_state.rounds.slice(0, game_state.rounds.length - 1)];
    mixer_left();
  }

  function update_razlika_slider() {
    if (game_state === undefined) return;
    game_state.new_round.osnovno.razlika = razlika_slider[razlika_slider_value];
  }

  function draw_updated_state() {
    if (game_state === undefined) return;
    update_scoreboard_total();
    razlika_slider_value = razlika_slider.indexOf(game_state.new_round.osnovno.razlika);
  }

  function import_counter_osnovno(razlika: string, kings: Realizacija, trula: Realizacija) {
    if (game_state === undefined) return;
    game_state.new_round.osnovno.razlika = razlika;
    game_state.new_round.osnovno.kralji = kings;
    game_state.new_round.osnovno.trula = trula;
    draw_updated_state();
    document.getElementById('osnovno')?.scrollIntoView({ behavior: 'smooth' });
  }

  function import_counter_klop(player_id: number) {
    if (game_state === undefined) return;
    game_state.new_round.klop.points[player_id] = Math.floor((Math.abs(counter_points) + 2) / 5) * 5;
    document.getElementById('klop')?.scrollIntoView({ behavior: 'smooth' });
  }

  function import_counter_player() {
    import_counter_osnovno(counter_razlika, counter_kings, counter_trula);
  }

  function import_counter_enemy() {
    const invert_realizacija = (realizacija: Realizacija) => {
      switch (realizacija) {
        case Realizacija.Narejena:
          return Realizacija.Izgubljena;
        case Realizacija.Brez:
          return Realizacija.Brez;
        case Realizacija.Izgubljena:
          return Realizacija.Narejena;
      }
    };
    counter_razlika = counter_razlika.startsWith('+')
      ? counter_razlika.replace('+', '-')
      : counter_razlika.replace('-', '+');

    import_counter_osnovno(counter_razlika, invert_realizacija(counter_kings), invert_realizacija(counter_trula));
  }

  function show_if_round(round_type: NewRoundType) {
    if (game_state === undefined) return true;
    return round_type_game(game_state.new_round.round_type) !== round_type;
  }

  $: game_state !== undefined && update_state();
</script>

<h1>{data.room.title}</h1>

{#if game_state !== undefined}
  <h2>Točke</h2>

  <button on:click={mixer_left}>&lt;</button>
  Mešalec
  <button on:click={mixer_right}>&gt;</button>

  <table id="scoreboard">
    <tr />
    {#each data.room.player_names as player_name, i}
      <th class:mixer={i == game_state.mixer}>
        {player_name}
      </th>
    {/each}
    <tr>
      {#each radelc_total as radelc}
        <td>Rad: {radelc}</td>
      {/each}
    </tr>
    {#each game_state.rounds as round}
      <tr>
        {#each round.points_change as points, i}
          <td>
            {points}
            {#if i == round.primary_player}
              ({round_type_shorthand(round.round_type)})
            {/if}
          </td>
        {/each}
      </tr>
    {/each}
    <tr>
      {#each points_total as points}
        <td>={points}</td>
      {/each}
    </tr>
  </table>

  <button on:click={undo_round}>Razveljavi rundo</button>

  <h2>Nova runda</h2>

  <input type="radio" bind:group={game_state.new_round.round_type} value={RoundType.Rocno} id="TypeRocno" />
  <label for="TypeRocno">Ročno</label>
  <input type="radio" bind:group={game_state.new_round.round_type} value={RoundType.Renons} id="TypeRenons" />
  <label for="TypeRenons">Renons</label>
  <br /><br />
  <input type="radio" bind:group={game_state.new_round.round_type} value={RoundType.Klop} id="TypeKlop" />
  <label for="TypeKlop">Klop</label>
  <input type="radio" bind:group={game_state.new_round.round_type} value={RoundType.Pikolo} id="TypePikolo" />
  <label for="TypePikolo">Pikolo</label>
  <input type="radio" bind:group={game_state.new_round.round_type} value={RoundType.Berac} id="TypeBerac" />
  <label for="TypeBerac">Berač</label>
  <input type="radio" bind:group={game_state.new_round.round_type} value={RoundType.OdprtiBerac} id="TypeOdprtiBerac" />
  <label for="TypeOdprtiBerac">Odprti berač</label>
  <br />
  <input type="radio" bind:group={game_state.new_round.round_type} value={RoundType.Tri} id="TypeTri" />
  <label for="TypeTri">Tri</label>
  <input type="radio" bind:group={game_state.new_round.round_type} value={RoundType.Dva} id="TypeDva" />
  <label for="TypeDva">Dva</label>
  <input type="radio" bind:group={game_state.new_round.round_type} value={RoundType.Ena} id="TypeEna" />
  <label for="TypeEna">Ena</label>
  <br />
  <input type="radio" bind:group={game_state.new_round.round_type} value={RoundType.SoloTri} id="TypeSoloTri" />
  <label for="TypeSoloTri">Solo tri</label>
  <input type="radio" bind:group={game_state.new_round.round_type} value={RoundType.SoloDva} id="TypeSoloDva" />
  <label for="TypeSoloDva">Solo dva</label>
  <input type="radio" bind:group={game_state.new_round.round_type} value={RoundType.SoloEna} id="TypeSoloEna" />
  <label for="TypeSoloEna">Solo ena</label>
  <input type="radio" bind:group={game_state.new_round.round_type} value={RoundType.SoloBrez} id="TypeSoloBrez" />
  <label for="TypeSoloBrez">Solo brez</label>
  <br />
  <input type="radio" bind:group={game_state.new_round.round_type} value={RoundType.BarvniValat} id="TypeBarvniValat" />
  <label for="TypeBarvniValat">Barvni valat</label>
  <input type="radio" bind:group={game_state.new_round.round_type} value={RoundType.Valat} id="TypeValat" />
  <label for="TypeValat">Valat</label>

  <div id="klop" hidden={!show_if_round(NewRoundType.Klop)}>
    <h3>Igralec</h3>
    {#each data.room.player_names as player_name, i}
      <input
        type="radio"
        bind:group={game_state.new_round.player}
        value={i}
        id="player_{i}"
        on:change={primary_player_changed}
      />
      <label for="player_{i}">{player_name}</label>
    {/each}
  </div>

  <div hidden={show_if_round(NewRoundType.Rocno)}>
    <h3>Točke</h3>
    {#each data.room.player_names as player_name, i}
      <label for="rocno_points_{i}">{player_name}</label>
      <input type="number" bind:value={game_state.new_round.rocno.points_change[i]} id="rocno_points_{i}" />
      <br />
    {/each}

    <h3>Radelci</h3>
    {#each data.room.player_names as player_name, i}
      <label for="rocno_radelci_{i}">{player_name}</label>
      <input type="number" bind:value={game_state.new_round.rocno.radelc_change[i]} id="rocno_radelci_{i}" />
      <br />
    {/each}
  </div>
  <div hidden={show_if_round(NewRoundType.Renons)} />
  <div id="osnovno" hidden={show_if_round(NewRoundType.Osnovno)}>
    <div hidden={game_is_solo(player_count, game_state.new_round.round_type)}>
      <h3>Rufan igralec</h3>
      <input type="radio" bind:group={game_state.new_round.osnovno.rufan_igralec} value={undefined} id="rufan_solo" />
      <label for="rufan_solo">Solo</label>
      {#each data.room.player_names as player_name, i}
        <span hidden={i === game_state.new_round.player}>
          <input type="radio" bind:group={game_state.new_round.osnovno.rufan_igralec} value={i} id="rufan_{i}" />
          <label for="rufan_{i}">{player_name}</label>
        </span>
      {/each}
    </div>

    <h3>
      <label for="razlika">Razlika</label>
    </h3>
    <input
      type="range"
      min="0"
      max="15"
      id="razlika"
      bind:value={razlika_slider_value}
      on:input={update_razlika_slider}
    />{razlika_slider[razlika_slider_value]}

    <h3>Trula</h3>
    <InputRealizacija id="trula" bind:value={game_state.new_round.osnovno.trula} />

    <h3>Kralji</h3>
    <InputRealizacija id="kralji" bind:value={game_state.new_round.osnovno.kralji} />

    <h3>Pagat ultimo</h3>
    <InputRealizacija id="pagat_ultimo" bind:value={game_state.new_round.osnovno.pagat_ultimo} />

    <h3>Kralj ultimo</h3>
    <InputRealizacija id="kralj_ultimo" bind:value={game_state.new_round.osnovno.kralj_ultimo} />

    <h3>Mond vzet</h3>
    <input type="radio" bind:group={game_state.new_round.osnovno.mondfang} value={undefined} id="mond_brez" />
    <label for="mond_brez">Ni vzet</label>
    {#each data.room.player_names as player_name, i}
      <input type="radio" bind:group={game_state.new_round.osnovno.mondfang} value={i} id="mond_{i}" />
      <label for="mond_{i}">{player_name}</label>
    {/each}
  </div>

  <div hidden={show_if_round(NewRoundType.Klop)}>
    <h3>Klop</h3>
    {#each data.room.player_names as player_name, i}
      <label for="klop_{i}">{player_name}</label>
      <input type="range" step="5" min="0" max="70" id="klop_{i}" bind:value={game_state.new_round.klop.points[i]} />
      {game_state.new_round.klop.points[i]}
      <br />
    {/each}
  </div>

  <div hidden={show_if_round(NewRoundType.Opravljanje)}>
    <label for="igra_opravljena">Igra opravljena</label>
    <input type="checkbox" bind:checked={game_state.new_round.opravljanje.opravljeno} id="igra_opravljena" />
  </div>

  <button on:click={submit_round}>Potrdi</button>
{:else}
  Nalaganje povezave
{/if}

<h2>Štetje</h2>
<ScoreCounter
  bind:points={counter_points}
  bind:razlika={counter_razlika}
  bind:kralji={counter_kings}
  bind:trula={counter_trula}
/>

{#if game_state !== undefined}
  <div hidden={show_if_round(NewRoundType.Klop)}>
    {#each data.room.player_names as player_name, i}
      <button on:click={() => import_counter_klop(i)}>Vpiši za {player_name}</button>
    {/each}
  </div>

  <div hidden={show_if_round(NewRoundType.Osnovno)}>
    <button on:click={import_counter_player}>Vpiši za igralca</button>
    <button on:click={import_counter_enemy}>Vpiši za nasprotnika</button>
  </div>
{/if}

<h2>Povabi v sobo</h2>
<canvas id="invite_qr" />

<style>
  .mixer {
    background-color: aquamarine;
  }
</style>
