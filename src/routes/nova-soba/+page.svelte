<script lang="ts">
  export let player_count: number;

  const player_settings = [
    { player_display: 'Trije igralci', n: 3 },
    { player_display: 'Štrije igralci', n: 4 },
    { player_display: 'Pet igralcev', n: 5 },
  ];
  const player_placeholder = ['Prvi igralec', 'Drugi igralec', 'Tretji igralec', 'Četrti igralec', 'Peti igralec'];
</script>

<svelte:head>
  <title>Ustvari sobo</title>
</svelte:head>

<div class="container mx-auto p-8 px-0 md:px-8 space-y-8 overflow-auto flex flex-wrap justify-stretch">
  <div class="card flex-1">
    <div class="card-header">
      <h1 class="h1">Nova soba</h1>
    </div>
    <div class="p-4">
      <form method="POST" class="space-y-3">
        <div>
          <label for="title">
            <h3 class="h3">Ime sobe</h3>
          </label>
          <input class="input px-2" type="text" name="title" id="title" required />
        </div>

        <hr />

        <h3 class="h3">Število igralcev</h3>

        <div class="btn-group w-full variant-soft">
          {#each player_settings as player, i}
            {@const id = `players_${player.n}`}
            <label
              for={id}
              class="py-2 !px-0 flex flex-1 content-stretch"
              class:variant-filled-primary={player_count === player.n}
            >
              <input hidden type="radio" {id} bind:group={player_count} value={player.n} />
              <p class="flex-1 text-center">{player.player_display}</p>
            </label>
          {/each}
        </div>

        {#if player_count > 0}
          <h3 class="h3">Imena igralcev</h3>
          <div class="flex w-full content-stretch gap-4 flex-wrap">
            {#each [...Array(player_count || 0).keys()] as i}
              <div class="flex-1 min-w-[15rem]">
                <input
                  class="input px-2"
                  type="text"
                  name="player_{i}"
                  id="player_{i}"
                  placeholder={player_placeholder[i]}
                  required
                />
                <br />
              </div>
            {/each}
          </div>
        {/if}

        <p>
          <button class="btn variant-filled-primary" type="submit">Ustvari</button>
        </p>
      </form>
    </div>
  </div>
</div>
