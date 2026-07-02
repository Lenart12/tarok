<script lang="ts">
  import { persisted } from 'svelte-local-storage-store';
  import { onMount } from 'svelte';
  import { enhance } from '$app/forms';
  import { account } from '$lib/session';
  import { Paginator, TabGroup, Tab } from '@skeletonlabs/skeleton';
  import StatBar from '$lib/StatBar.svelte';
  import Obrazlozitev from '../[room_id]/Obrazlozitev.svelte';

  export let data;
  export let form;

  let editing_name = false;

  let igre_tab = 0;
  let napovedi_tab = 0;

  const pct = (part: number, whole: number) => (whole > 0 ? ((part / whole) * 100).toFixed(1) : '0.0');
  $: stats = data.stats;
  $: igral = stats.klicanje.klical + stats.klicanje.solo;
  $: igral_wins = stats.klicanje.klical_wins + stats.klicanje.solo_wins;
  $: klicanje_total = igral + stats.klicanje.poklican;

  $: best_room = data.rooms.length ? data.rooms.reduce((a, b) => (b.points > a.points ? b : a)) : null;
  $: worst_room = data.rooms.length ? data.rooms.reduce((a, b) => (b.points < a.points ? b : a)) : null;
  $: pbt_max = Math.max(1, ...stats.points_by_type.map((t) => Math.abs(t.points)));
  $: hist_max = Math.max(1, ...stats.histogram.map((h) => h.count));

  const room_ids = persisted('rooms', [] as string[]);

  type UnclaimedRoom = { room_id: string; title: string; created: number; player_names: string[] };
  let unclaimed: UnclaimedRoom[] = [];

  $: claimed_ids = new Set(data.rooms.map((r) => r.room_id));
  $: merged = [
    ...data.rooms.map((r) => ({ ...r, claimed: true as const })),
    ...unclaimed.map((r) => ({ ...r, claimed: false as const })),
  ].sort((a, b) => b.created - a.created);

  let paginationSettings = { page: 0, offset: 0, limit: 10, size: 0, amounts: [] };
  $: paginationSettings.size = merged.length;
  $: page_start = paginationSettings.page * paginationSettings.limit;
  $: visible = merged.slice(page_start, page_start + paginationSettings.limit);

  onMount(async () => {
    const out: UnclaimedRoom[] = [];
    for (const id of $room_ids) {
      if (claimed_ids.has(id)) continue;
      const res = await fetch(`/game/${id}`);
      if (!res.ok) continue;
      const room = await res.json();
      out.push({ room_id: id, title: room.title, created: room.created, player_names: room.player_names });
    }
    unclaimed = out.sort((a, b) => b.created - a.created);
  });
</script>

<svelte:head>
  <title>Moj profil - Tarok</title>
</svelte:head>

<div class="container mx-auto p-8 space-y-8">
  <div class="card px-8 py-4">
    <div class="card-header flex justify-between items-center gap-2">
      {#if editing_name}
        <form
          method="POST"
          action="?/update_name"
          class="flex gap-2 items-center flex-auto"
          use:enhance={({ formData }) => {
            const name = String(formData.get('display_name') ?? '').trim();
            return async ({ result, update }) => {
              await update({ reset: false });
              if (result.type === 'success') {
                account.update((a) => (a ? { ...a, display_name: name } : a));
                editing_name = false;
              }
            };
          }}
        >
          <input
            class="input px-2 h2 flex-auto"
            type="text"
            name="display_name"
            value={data.account.display_name}
            maxlength="40"
            required
          />
          <button type="submit" class="btn btn-sm variant-filled-primary">Shrani</button>
          <button type="button" class="btn btn-sm variant-soft" on:click={() => (editing_name = false)}>Prekliči</button>
        </form>
      {:else}
        <h1 class="h2 flex items-center gap-2">
          {data.account.display_name}
          <button
            type="button"
            class="btn btn-sm variant-ghost-surface"
            on:click={() => (editing_name = true)}>Uredi</button
          >
        </h1>
        <a class="btn btn-sm variant-ghost-surface" href="/logout" data-sveltekit-reload>Odjava</a>
      {/if}
    </div>
    <div class="p-4 space-y-4">
      <p class="opacity-75 text-sm">{data.account.email}</p>
      {#if form?.error}
        <aside class="alert variant-filled-error">
          <div class="alert-message">{form.error}</div>
        </aside>
      {/if}
      <div class="flex gap-8">
        <div>
          <div class="text-3xl font-bold">{data.total_points}</div>
          <div class="opacity-50 text-sm">Skupaj točk</div>
        </div>
        <div>
          <div class="text-3xl font-bold">{data.rooms.length}</div>
          <div class="opacity-50 text-sm">Sob</div>
        </div>
        <div>
          <div class="text-3xl font-bold">{data.total_rounds}</div>
          <div class="opacity-50 text-sm">Odigranih iger</div>
        </div>
      </div>
    </div>
  </div>

  <div class="card px-8 py-4">
    <div class="card-header"><h2 class="h3">Statistika</h2></div>
    <div class="p-4">
      {#if stats.total_rounds === 0}
        <p class="opacity-75">Ko boste odigrali nekaj iger v povezanih sobah, se bo tu pojavila statistika.</p>
      {:else}
        <div class="space-y-2">
          {#if stats.histogram.length > 0}
            <p class="text-sm opacity-60 mb-2">Porazdelitev rezultatov (na igro)</p>
            <div class="flex items-end gap-0.5 h-28">
              {#each stats.histogram as h (h.bucket)}
                <div
                  class="flex-1 flex flex-col justify-end h-full"
                  title={`${h.bucket} do ${h.bucket + 20}: ${h.count}×`}
                >
                  <div
                    class="w-full rounded-t {h.bucket >= 0 ? 'bg-primary-500' : 'bg-error-500'}"
                    style="height:{(h.count / hist_max) * 100}%"
                  />
                </div>
              {/each}
            </div>
            <div class="flex justify-between text-xs opacity-50 mt-1">
              <span>{stats.histogram[0].bucket}</span>
              <span>0</span>
              <span>{stats.histogram[stats.histogram.length - 1].bucket + 20}</span>
            </div>
            <hr class="!my-4" />
          {/if}
          <p class="text-sm opacity-60">Igre</p>
          <TabGroup>
            <Tab bind:group={igre_tab} name="igre" value={0}>Aktivna ekipa</Tab>
            <Tab bind:group={igre_tab} name="igre" value={1}>Pasivna ekipa</Tab>
            <Tab bind:group={igre_tab} name="igre" value={2}>Klicanje kralja</Tab>
            <svelte:fragment slot="panel">
              {#if igre_tab === 0}
                <p class="text-sm opacity-75 mb-2">
                  Igre, ki ste jih igrali kot aktivna ekipa (igralec ali poklicani partner).
                  Igrali ste {stats.active_summary.rounds} rund od {stats.total_rounds}
                  ({pct(stats.active_summary.rounds, stats.total_rounds)}%), zmagali
                  {stats.active_summary.wins} ({pct(stats.active_summary.wins, stats.active_summary.rounds)}%).
                </p>
                {#if stats.active.length === 0}
                  <p class="opacity-60">Ni podatkov.</p>
                {:else}
                  <div class="divide-y divide-surface-500/20">
                    {#each stats.active as s (s.round_type)}
                      <StatBar name={s.name} count={s.count} wins={s.wins} losses={s.losses} sum_points={s.sum_points} />
                    {/each}
                  </div>
                {/if}
              {:else if igre_tab === 1}
                <p class="text-sm opacity-75 mb-2">
                  Igre, ki ste jih branili kot pasivna ekipa. Uspešno ste ubranili
                  {stats.passive_summary.wins} rund od {stats.passive_summary.rounds}
                  ({pct(stats.passive_summary.wins, stats.passive_summary.rounds)}%).
                </p>
                {#if stats.passive.length === 0}
                  <p class="opacity-60">Ni podatkov.</p>
                {:else}
                  <div class="divide-y divide-surface-500/20">
                    {#each stats.passive as s (s.round_type)}
                      <StatBar name={s.name} count={s.count} wins={s.wins} losses={s.losses} sum_points={s.sum_points} />
                    {/each}
                  </div>
                {/if}
              {:else}
                <p class="text-sm opacity-75 mb-2">
                  Klicali ste {igral} rund in bili poklicani {stats.klicanje.poklican} rund
                  ({pct(igral, klicanje_total)}% klicanj).
                </p>
                {#if klicanje_total === 0}
                  <p class="opacity-60">Ni podatkov.</p>
                {:else}
                  <div class="divide-y divide-surface-500/20">
                    <StatBar
                      name="Igral / poklican"
                      count={klicanje_total}
                      wins={igral}
                      losses={stats.klicanje.poklican}
                      show_avg={false}
                      success_label="kot glavni igralec"
                    />
                    {#if igral > 0}
                      <StatBar
                        name="Solo zaruf (delež)"
                        count={igral}
                        wins={stats.klicanje.solo}
                        losses={stats.klicanje.klical}
                        show_avg={false}
                        success_label="zarufov"
                      />
                    {/if}
                  </div>
                  <p class="text-sm opacity-60 pt-3 mb-1">Uspešnost po vlogi</p>
                  <div class="divide-y divide-surface-500/20">
                    {#if igral > 0}
                      <StatBar
                        name="Kot glavni igralec"
                        count={igral}
                        wins={igral_wins}
                        losses={igral - igral_wins}
                        show_avg={false}
                      />
                    {/if}
                    {#if stats.klicanje.poklican > 0}
                      <StatBar
                        name="Kot poklican"
                        count={stats.klicanje.poklican}
                        wins={stats.klicanje.poklican_wins}
                        losses={stats.klicanje.poklican - stats.klicanje.poklican_wins}
                        show_avg={false}
                      />
                    {/if}
                    {#if stats.klicanje.solo > 0}
                      <StatBar
                        name="Solo zaruf"
                        count={stats.klicanje.solo}
                        wins={stats.klicanje.solo_wins}
                        losses={stats.klicanje.solo - stats.klicanje.solo_wins}
                        show_avg={false}
                      />
                    {/if}
                  </div>
                {/if}
              {/if}
            </svelte:fragment>
          </TabGroup>

          {#if stats.points_by_type.length > 0}
            <hr class="!my-4" />
            <p class="text-sm opacity-60 mb-2">Vir točk</p>
            <div class="space-y-1">
              {#each stats.points_by_type as t (t.round_type)}
                <div class="flex items-center gap-2 text-sm">
                  <span class="w-28 shrink-0 truncate">{t.name}</span>
                  <div class="flex-auto h-4 rounded overflow-hidden bg-surface-300-600-token">
                    <div
                      class="h-full {t.points >= 0 ? 'bg-primary-500' : 'bg-error-500'}"
                      style="width:{(Math.abs(t.points) / pbt_max) * 100}%"
                    />
                  </div>
                  <span
                    class="w-16 text-right font-semibold {t.points >= 0 ? 'text-primary-500' : 'text-error-500'}"
                    >{t.points > 0 ? '+' : ''}{t.points}</span
                  >
                </div>
              {/each}
            </div>
          {/if}

          <hr class="!my-4" />
          <p class="text-sm opacity-60">Napovedi</p>
          <TabGroup>
            <Tab bind:group={napovedi_tab} name="napovedi" value={0}>Tihe napovedi</Tab>
            <Tab bind:group={napovedi_tab} name="napovedi" value={1}>Izrečene napovedi</Tab>
            <svelte:fragment slot="panel">
              {#if napovedi_tab === 0}
                <p class="text-sm opacity-75 mb-2">Bonusi, ki jih je aktivna ekipa dosegla brez napovedi.</p>
                {#if stats.tihe.length === 0}
                  <p class="opacity-60">Ni podatkov.</p>
                {:else}
                  <div class="divide-y divide-surface-500/20">
                    {#each stats.tihe as s (s.name)}
                      <StatBar name={s.name} count={s.count} wins={s.wins} losses={s.losses} sum_points={s.sum_points} />
                    {/each}
                  </div>
                {/if}
              {:else}
                <p class="text-sm opacity-75 mb-2">Napovedani bonusi (šteto aktivni ekipi).</p>
                {#if stats.izrecene.length === 0}
                  <p class="opacity-60">Ni podatkov.</p>
                {:else}
                  <div class="divide-y divide-surface-500/20">
                    {#each stats.izrecene as s (s.name)}
                      <StatBar name={s.name} count={s.count} wins={s.wins} losses={s.losses} sum_points={s.sum_points} />
                    {/each}
                  </div>
                {/if}
              {/if}
            </svelte:fragment>
          </TabGroup>

          {#if stats.mond_caught > 0}
            <hr class="!my-4" />
            <p class="text-sm opacity-60 mb-2">Mond</p>
            <p class="text-sm opacity-75">
              Vaš mond je bil vzet <strong>{stats.mond_caught}×</strong>
              (skupaj {stats.mond_caught * 20} točk izgube).
            </p>
          {/if}

          <hr class="!my-4" />
          <p class="text-sm opacity-60">Rekordi</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {#if best_room}
              <a href={`/${best_room.room_id}`} class="card variant-soft p-3 block">
                <div class="opacity-60 text-xs">Najboljša soba</div>
                <div class="anchor font-bold truncate">{best_room.title}</div>
                <div class="text-primary-500 font-bold">
                  {best_room.points > 0 ? '+' : ''}{best_room.points} točk
                </div>
              </a>
            {/if}
            {#if worst_room}
              <a href={`/${worst_room.room_id}`} class="card variant-soft p-3 block">
                <div class="opacity-60 text-xs">Najslabša soba</div>
                <div class="anchor font-bold truncate">{worst_room.title}</div>
                <div class="text-error-500 font-bold">
                  {worst_room.points > 0 ? '+' : ''}{worst_room.points} točk
                </div>
              </a>
            {/if}
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {#if stats.biggest_win}
              <div class="card variant-soft p-3 space-y-1">
                <div class="flex justify-between items-baseline">
                  <span class="opacity-60 text-xs">Največji dobitek</span>
                  <a href={`/${stats.biggest_win.room_id}`} class="anchor text-xs truncate ml-2"
                    >{stats.biggest_win.title}</a
                  >
                </div>
                <div class="text-2xl font-bold text-primary-500">+{stats.biggest_win.points}</div>
                <div class="text-sm">
                  <Obrazlozitev
                    id={stats.biggest_win.round_index + 1}
                    round={stats.biggest_win.round}
                    player_names={stats.biggest_win.player_names}
                  />
                </div>
              </div>
            {/if}
            {#if stats.biggest_loss}
              <div class="card variant-soft p-3 space-y-1">
                <div class="flex justify-between items-baseline">
                  <span class="opacity-60 text-xs">Največja izguba</span>
                  <a href={`/${stats.biggest_loss.room_id}`} class="anchor text-xs truncate ml-2"
                    >{stats.biggest_loss.title}</a
                  >
                </div>
                <div class="text-2xl font-bold text-error-500">{stats.biggest_loss.points}</div>
                <div class="text-sm">
                  <Obrazlozitev
                    id={stats.biggest_loss.round_index + 1}
                    round={stats.biggest_loss.round}
                    player_names={stats.biggest_loss.player_names}
                  />
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>

  <div class="card px-8 py-4">
    <div class="card-header"><h2 class="h3">Moje sobe</h2></div>
    <div class="p-4">
      {#if data.rooms.length === 0 && unclaimed.length === 0}
        <p class="opacity-75">Še niste povezani z nobenim mestom. Odprite sobo in v urejanju igralcev kliknite »Prijava«.</p>
      {:else}
        <ul class="list-dl">
          {#each visible as room (room.room_id)}
            <hr />
            <li>
              <a class="flex-auto" href={`/${room.room_id}`}>
                <dt>
                  <span class="anchor font-bold">{room.title}</span>
                  <span class="opacity-50 text-sm"> - {new Date(room.created).toLocaleDateString()}</span>
                  {#if !room.claimed}
                    <span class="badge variant-soft ml-2">nepovezano</span>
                  {/if}
                </dt>
                {#if room.claimed}
                  <dd class="text-sm opacity-75">
                    {room.player_name}: <strong>{room.points}</strong> točk{room.radelci > 0 ? `, ${room.radelci}R` : ''} · {room.round_count} iger
                  </dd>
                {:else}
                  <dd class="text-sm opacity-50">
                    {room.player_names.join(', ')}
                  </dd>
                {/if}
              </a>
            </li>
          {/each}
          <hr />
        </ul>
        {#if merged.length > paginationSettings.limit}
          <div class="flex justify-center mt-4">
            <Paginator
              bind:settings={paginationSettings}
              controlVariant="variant-soft"
              on:page={(e) => (paginationSettings = { ...paginationSettings, page: e.detail })}
            />
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>
