<script lang="ts">
  import type { GameRoom } from '$lib/tarok';
  import { persisted } from 'svelte-local-storage-store';
  import { Paginator } from '@skeletonlabs/skeleton';
  import { onMount } from 'svelte';

  const room_ids = persisted('rooms', [] as string[]);
  const room_created = persisted('room_created', {} as Record<string, number>);
  let room_cache: Record<string, GameRoom> = {};
  let account_room_ids: string[] = [];

  onMount(async () => {
    try {
      const claims = (await (await fetch('/api/me')).json()).claims as { room_id: string }[];
      account_room_ids = claims.map((c) => c.room_id);
    } catch {
      account_room_ids = [];
    }
  });

  let paginationSettings = {
    page: 0,
    offset: 0,
    limit: 5,
    size: 0,
    amounts: [],
  };

  $: all_ids = Array.from(new Set([...account_room_ids, ...$room_ids]));
  $: created_of = (id: string) => $room_created[id] ?? room_cache[id]?.created ?? 0;
  $: sorted_ids = [...all_ids].sort((a, b) => created_of(b) - created_of(a));
  $: paginationSettings.size = sorted_ids.length;
  $: page_start = paginationSettings.page * 5;
  $: page_end = Math.min(page_start + 5, sorted_ids.length);
  $: visible_ids = sorted_ids.slice(page_start, page_end);
  $: load_rooms(visible_ids);

  async function load_rooms(ids: string[]) {
    for (let room_id of ids) {
      if (room_cache[room_id]) continue;
      let response = await fetch(`game/${room_id}`);
      if (!response.ok) {
        // Stale id (e.g. a deleted room) - drop it from the saved list.
        if ($room_ids.includes(room_id)) unsave_room(room_id);
        continue;
      }
      let game_room = await response.json();
      room_cache = { ...room_cache, [room_id]: game_room };
      // Backfill created time for rooms saved before it was tracked.
      if ($room_created[room_id] === undefined) {
        room_created.update((m) => ({ ...m, [room_id]: game_room.created }));
      }
    }
  }

  function unsave_room(room_id: string) {
    room_ids.set($room_ids.filter((room) => room !== room_id));
    room_created.update((m) => {
      const next = { ...m };
      delete next[room_id];
      return next;
    });
  }
</script>

<svelte:head>
  <title>Tarok</title>
</svelte:head>

<div class="container mx-auto p-8 space-y-8">
  <div class="card px-8 py-4">
    <div class="card-header">
      <h1>Moje sobe</h1>
    </div>
    <div class="p-4">
      <hr />
      <ul class="list-dl">
        {#each visible_ids as room_id}
          <li class="flex items-start gap-4">
            {#if room_cache[room_id]}
              {@const room = room_cache[room_id]}
              <a class="flex-auto" href={room.id}>
                <dt>
                  <span class="anchor font-bold">{room.title}</span>
                  <span class="opacity-50 text-sm"> - {new Date(room.created).toLocaleDateString()}</span>
                </dt>
                <dd class="text-sm opacity-50">
                  {room.player_names.join(', ')}
                </dd>
              </a>
              {#if !account_room_ids.includes(room_id)}
                <button class="anchor text-sm opacity-50 shrink-0" on:click={() => unsave_room(room.id)}>Zapusti</button>
              {/if}
            {:else}
              <div class="flex-auto">
                <dt class="placeholder animate-pulse w-28 p-4" />
              </div>
            {/if}
          </li>
          <hr />
        {/each}
      </ul>
      {#if all_ids.length > 5}
        <div class="flex justify-center">
          <div class="mt-4">
            <Paginator
              bind:settings={paginationSettings}
              controlVariant="variant-soft"
              on:page={(e) => (paginationSettings = { ...paginationSettings, page: e.detail })}
            />
          </div>
        </div>
      {/if}
      <div class="flex justify-center">
        <a class="block btn variant-filled w-full max-w-md bg-primary-active-token mt-8" href="nova-soba"
          >Ustvari sobo</a
        >
      </div>
    </div>
  </div>
</div>
