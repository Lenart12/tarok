<script lang="ts">
  import type { GameRoom } from '$lib/tarok';
  import { persisted } from 'svelte-local-storage-store';
  import { Paginator } from '@skeletonlabs/skeleton';

  const room_ids = persisted('rooms', [] as string[]);
  let room_cache: Record<string, GameRoom> = {};

  let paginationSettings = {
    page: 0,
    offset: 0,
    limit: 5,
    size: 0,
    amounts: [],
  };

  $: paginationSettings.size = $room_ids.length;
  $: page_start = paginationSettings.page * 5;
  $: page_end = Math.min(page_start + 5, $room_ids.length);
  $: visible_ids = $room_ids.slice(page_start, page_end);
  $: load_rooms(visible_ids);

  async function load_rooms(ids: string[]) {
    for (let room_id of ids) {
      if (room_cache[room_id]) continue;
      let response = await fetch(`game/${room_id}`);
      let game_room = await response.json();
      room_cache = { ...room_cache, [room_id]: game_room };
    }
  }

  function unsave_room(room_id: string) {
    room_ids.set($room_ids.filter((room) => room !== room_id));
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
          <li>
            <span class="flex-auto">
              {#if room_cache[room_id]}
                {@const room = room_cache[room_id]}
                <a href={room.id}>
                  <dt>
                    <span class="anchor font-bold">{room.title}</span>
                    <span class="opacity-50 text-sm"> - {new Date(room.created).toLocaleDateString()}</span>
                    <button class="ml-4 anchor text-sm opacity-50" on:click={() => unsave_room(room.id)}>Zapusti</button>
                  </dt>
                  <dd class="text-sm opacity-50">
                    {room.player_names.join(', ')}
                  </dd>
                </a>
              {:else}
                <div>
                  <dt class="placeholder animate-pulse w-28 p-4" />
                </div>
              {/if}
            </span>
          </li>
          <hr />
        {/each}
      </ul>
      {#if $room_ids.length > 5}
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
