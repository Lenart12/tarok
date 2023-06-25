<script lang="ts">
  import type { GameRoom } from '$lib/tarok';
  import { onMount } from 'svelte';
  import { persisted } from 'svelte-local-storage-store';

  const room_ids = persisted('rooms', [] as string[]);
  let saved_rooms = [] as GameRoom[];

  async function load_rooms(room_ids: string[]) {
    let rooms = [];
    for (let room_id of room_ids) {
      let response = await fetch(`game/${room_id}`);
      let game_room = await response.json();
      rooms.push(game_room);
      saved_rooms = rooms;
    }
  }

  onMount(async () => {
    load_rooms($room_ids);
  });

  function unsave_room(room_id: string) {
    saved_rooms = saved_rooms.filter((room) => room.id !== room_id);
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
        {#each saved_rooms as room}
          <li>
            <span class="flex-auto">
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
            </span>
          </li>
          <hr />
        {/each}
        {#each new Array($room_ids.length - saved_rooms.length) as _}
          <li>
            <span class="flex-auto">
              <div>
                <dt class="placeholder animate-pulse w-28 p-4" />
              </div>
            </span>
          </li>
          <hr />
        {/each}
      </ul>
      <div class="flex justify-center">
        <a class="block btn variant-filled w-full max-w-md bg-primary-active-token mt-8" href="nova-soba"
          >Ustvari sobo</a
        >
      </div>
    </div>
  </div>
</div>
