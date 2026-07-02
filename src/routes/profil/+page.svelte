<script lang="ts">
  import { persisted } from 'svelte-local-storage-store';
  import { onMount } from 'svelte';
  import { enhance } from '$app/forms';
  import { account } from '$lib/session';
  import { Paginator } from '@skeletonlabs/skeleton';

  export let data;
  export let form;

  let editing_name = false;

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
