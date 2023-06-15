<script lang="ts">
  import type { GameRoom } from '$lib/tarok';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

  export let saved_rooms = [] as GameRoom[];

  onMount(async () => {
    if (browser) {
      let room_ids = JSON.parse(localStorage.getItem('rooms') || '[]');

      let rooms = [];
      for (let room_id of room_ids) {
        let response = await fetch(`game/${room_id}`);
        let game_room = await response.json();
        console.log(game_room);
        rooms.push(game_room);
      }
      saved_rooms = rooms;
    }
  });

  function room_name(room: GameRoom) {
    return `${room.title} - ${room.player_names.join(', ')}`;
  }

  function unsave_room(room_id: string) {
    let rooms = JSON.parse(localStorage.getItem('rooms') || '[]') as string[];
    rooms = rooms.filter((id) => id !== room_id);
    localStorage.setItem('rooms', JSON.stringify(rooms));
    saved_rooms = saved_rooms.filter((room) => room.id !== room_id);
  }
</script>

<div class="container mx-auto p-8 space-y-8">
  <div class="card p-4">
    <div class="card-header w-full content-center">
      <a class="btn variant-filled w-full max-w-md" href="nova-soba">Ustvari sobo</a>
    </div>

    <h2>Prejšne sobe<a href="https://www.youtube.com/watch?v=mWVs3Cr4P0I">.</a></h2>
    <ul>
      {#each saved_rooms as room}
        <li>
          <a href={room.id}>{room_name(room)}</a>
          <button on:click={() => unsave_room(room.id)}>X</button>
        </li>
      {/each}
    </ul>
  </div>
</div>
