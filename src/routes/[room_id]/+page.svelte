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

  import { persisted } from 'svelte-local-storage-store';
  import RoundSelector from './RoundSelector.svelte';
  import { SlideToggle, clipboard } from '@skeletonlabs/skeleton';

  const room_ids = persisted('rooms', [] as string[]);

  export let data;

  const player_count = data.room.player_names.length;
  let radelc_total = [] as number[];
  let points_total = [] as number[];

  let game_state: GameState | undefined = undefined;
  let old_game_state: GameState | undefined = undefined;

  let round: RoundType;
  $: round = game_state?.new_round.round_type || RoundType.Rocno;

  onMount(async () => {
    if ($room_ids.indexOf(data.room.id) === -1) room_ids.set([...$room_ids, data.room.id]);

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

  function show_if_round(current: RoundType, round_type: NewRoundType) {
    if (game_state === undefined) return true;
    return round_type_game(current) !== round_type;
  }

  $: game_state !== undefined && update_state();
</script>

<div class="container mx-auto p-8 space-y-8">
  <h1 class="h1">{data.room.title}</h1>

  {#if game_state !== undefined}
    <div class="card min-w-fit">
      <div class="card-header">
        <h2 class="h2">Točke</h2>
      </div>

      <div class="p-4">
        <table id="scoreboard" class="divide-y divide-primary-700 w-full">
          <tr>
            {#each data.room.player_names as player_name, i}
              <th class="m-4 w-1/4">
                {player_name}
                {#if i === game_state.mixer}
                  <div class="badge variant-filled-primary p-1" />
                {/if}
              </th>
            {/each}
          </tr>
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
                  {#if i == round.primary_player && round_type_shorthand(round.round_type) !== ''}
                    <div class="badge variant-glass-primary">
                      {round_type_shorthand(round.round_type)}
                    </div>
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

        <div class="flex justify-center flex-wrap gap-4 mt-8">
          <button class="btn variant-soft" on:click={undo_round}>Razveljavi rundo</button>

          <div class="btn-group variant-soft">
            <button on:click={mixer_left}>&lt;</button>
            <span class="flex items-center">Mešalec</span>
            <button on:click={mixer_right}>&gt;</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card min-w-fit">
      <div class="card-header">
        <h2 class="h2">Nova runda</h2>
      </div>

      <div class="p-4 space-y-4">
        <RoundSelector bind:value={game_state.new_round.round_type} />

        <hr />

        <div
          class="p-4"
          id="klop"
          hidden={!show_if_round(round, NewRoundType.Klop) || !show_if_round(round, NewRoundType.Rocno)}
        >
          <h3 class="h3">Igralec</h3>

          <div class="btn-group variant-soft">
            {#each data.room.player_names as player_name, i}
              {@const id = `player_${i}`}
              <label
                for={id}
                class="py-2 px-3 flex items-center"
                class:variant-filled-primary={game_state.new_round.player === i}
              >
                <input
                  hidden
                  type="radio"
                  {id}
                  bind:group={game_state.new_round.player}
                  value={i}
                  on:change={primary_player_changed}
                />
                <p>{player_name}</p>
              </label>
            {/each}
          </div>
        </div>

        <div hidden={show_if_round(round, NewRoundType.Rocno)}>
          <h3 class="h3">Točke</h3>
          {#each data.room.player_names as player_name, i}
            <label class="label" for="rocno_points_{i}">{player_name}</label>
            <input
              class="input"
              type="number"
              bind:value={game_state.new_round.rocno.points_change[i]}
              id="rocno_points_{i}"
            />
            <br />
          {/each}

          <h3 class="h3">Radelci</h3>
          {#each data.room.player_names as player_name, i}
            <label class="label" for="rocno_radelci_{i}">{player_name}</label>
            <input
              class="input"
              type="number"
              bind:value={game_state.new_round.rocno.radelc_change[i]}
              id="rocno_radelci_{i}"
            />
            <br />
          {/each}
        </div>
        <div hidden={show_if_round(round, NewRoundType.Renons)}>
          <aside class="alert variant-filled-error">
            <div class="alert-message">
              <h3 class="h3">RENONS!</h3>
            </div>
          </aside>
        </div>
        <div class="px-4 pb-4 space-y-4" id="osnovno" hidden={show_if_round(round, NewRoundType.Osnovno)}>
          <div hidden={game_is_solo(player_count, game_state.new_round.round_type)}>
            <h3 class="h3">Rufan igralec</h3>

            <div class="btn-group variant-soft">
              <label
                for="rufan_solo"
                class="py-2 px-3 flex items-center"
                class:variant-filled-primary={game_state.new_round.osnovno.rufan_igralec === undefined}
              >
                <input
                  hidden
                  type="radio"
                  id="rufan_solo"
                  bind:group={game_state.new_round.osnovno.rufan_igralec}
                  value={undefined}
                />
                <p>Solo</p>
              </label>
              {#each data.room.player_names as player_name, i}
                {@const id = `rufan_${i}`}
                <label
                  for={id}
                  class="py-2 px-3 flex items-center"
                  class:variant-filled-primary={game_state.new_round.osnovno.rufan_igralec === i}
                  class:hidden={game_state.new_round.player === i}
                >
                  <input hidden type="radio" {id} bind:group={game_state.new_round.osnovno.rufan_igralec} value={i} />
                  <p>{player_name}</p>
                </label>
              {/each}
            </div>
          </div>

          <div>
            <h3 class="h3">
              <label class="label" for="razlika">
                Razlika
                <div class="badge variant-filled-primary" class:variant-filled-error={razlika_slider_value < 8}>
                  {razlika_slider[razlika_slider_value]}
                </div>
              </label>
            </h3>
            <input
              class="input"
              type="range"
              min="0"
              max="15"
              id="razlika"
              bind:value={razlika_slider_value}
              on:input={update_razlika_slider}
            />
          </div>

          <div>
            <h3 class="h3">Trula</h3>
            <InputRealizacija id="trula" bind:value={game_state.new_round.osnovno.trula} />
          </div>

          <div>
            <h3 class="h3">Kralji</h3>
            <InputRealizacija id="kralji" bind:value={game_state.new_round.osnovno.kralji} />
          </div>

          <div>
            <h3 class="h3">Pagat ultimo</h3>
            <InputRealizacija id="pagat_ultimo" bind:value={game_state.new_round.osnovno.pagat_ultimo} />
          </div>

          <div>
            <h3 class="h3">Kralj ultimo</h3>
            <InputRealizacija id="kralj_ultimo" bind:value={game_state.new_round.osnovno.kralj_ultimo} />
          </div>

          <div>
            <h3 class="h3">Mond vzet</h3>

            <div class="btn-group variant-soft">
              <label
                for="mond_brez"
                class="py-2 px-3 flex items-center"
                class:variant-filled-primary={game_state.new_round.osnovno.mondfang === undefined}
              >
                <input
                  hidden
                  type="radio"
                  id="mond_brez"
                  bind:group={game_state.new_round.osnovno.mondfang}
                  value={undefined}
                />
                <p>Brez</p>
              </label>
              {#each data.room.player_names as player_name, i}
                {@const id = `mondfang_${i}`}
                <label
                  for={id}
                  class="py-2 px-3 flex items-center"
                  class:variant-filled-error={game_state.new_round.osnovno.mondfang === i}
                >
                  <input hidden type="radio" {id} bind:group={game_state.new_round.osnovno.mondfang} value={i} />
                  <p>{player_name}</p>
                </label>
              {/each}
            </div>
          </div>
        </div>

        <div class="p-4" hidden={show_if_round(round, NewRoundType.Klop)}>
          <h3 class="h3">Klop</h3>
          {#each data.room.player_names as player_name, i}
            <label class="label" for="klop_{i}"
              >{player_name}
              <div class="badge variant-filled-primary">{game_state.new_round.klop.points[i]}</div></label
            >
            <input
              class="input"
              type="range"
              step="5"
              min="0"
              max="70"
              id="klop_{i}"
              bind:value={game_state.new_round.klop.points[i]}
            />
            <br />
          {/each}
          {#if game_state.new_round.klop.points.reduce((a, v) => a + v) !== 70}
            <aside class="alert variant-filled-error">
              <div class="alert-message">
                <h3 class="h3">Vsota ni 70 ({game_state.new_round.klop.points.reduce((a, v) => a + v)})!</h3>
              </div>
            </aside>
          {/if}
        </div>

        <div hidden={show_if_round(round, NewRoundType.Opravljanje)}>
          <SlideToggle
            name="igra_opravljena"
            bind:checked={game_state.new_round.opravljanje.opravljeno}
            active="bg-primary-900: dark:bg-primary-300"
          >
            Igra {game_state.new_round.opravljanje.opravljeno ? 'opravljena' : 'ni opravljena'}
          </SlideToggle>
        </div>

        <div class="flex justify-center">
          <button class="btn variant-filled-primary" on:click={submit_round}>Potrdi</button>
        </div>
      </div>
    </div>
  {:else}
    Nalaganje povezave
  {/if}

  <div class="card min-w-fit">
    <div class="p-4 space-y-2">
      <h2 class="h2">Štetje</h2>
      <ScoreCounter
        bind:points={counter_points}
        bind:razlika={counter_razlika}
        bind:kralji={counter_kings}
        bind:trula={counter_trula}
      />

      {#if game_state !== undefined}
        <div class="p-4">
          <div hidden={show_if_round(round, NewRoundType.Klop)}>
            <h2 class="h2">Vpiši za</h2>

            <div class="flex justify-center">
              <div class="btn-group variant-filled-primary">
                {#each data.room.player_names as player_name, i}
                  <button on:click={() => import_counter_klop(i)}>{player_name}</button>
                {/each}
              </div>
            </div>
          </div>

          <div hidden={show_if_round(round, NewRoundType.Osnovno)}>
            <h2 class="h2">Vpiši za</h2>
            <div class="flex justify-center">
              <div class="btn-group variant-filled-primary">
                <button on:click={import_counter_player}>Igralca</button>
                <button on:click={import_counter_enemy}>Nasprotnika</button>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <div class="card">
    <div class="p-4 space-y-2">
      <h2 class="h2">Povabi v sobo</h2>
      <div class="flex justify-center">
        <button class="btn variant-filled-primary" use:clipboard={window.location}>Kopiraj povezavo</button>
      </div>
      <div class="flex justify-center">
        <canvas id="invite_qr" />
      </div>
    </div>
  </div>
</div>
