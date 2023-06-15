<script lang="ts">
  export let player_count: number;
</script>

<div>
  <h1>Nova soba</h1>

  <form method="POST">
    <label for="title">
      <h2>Ime sobe</h2>
    </label>
    <input type="text" name="title" id="title" required />

    <h2>Število igralcev</h2>
    <input type="radio" name="player_count" id="three_player" required bind:group={player_count} value={3} />
    <label for="three_players">Tri igralci</label>

    <input type="radio" name="player_count" id="four_player" required bind:group={player_count} value={4} />
    <label for="four_players">Štiri igralci</label>

    <input type="radio" name="player_count" id="five_player" required bind:group={player_count} value={5} />
    <label for="four_players">Pet igralcev</label>

    <h2>Imena igralcev</h2>

    {#each [...Array(player_count || 0).keys()] as i}
      <label for="player_{i}">
        {i + 1}:
      </label>
      <input type="text" name="player_{i}" id="player_{i}" required />
      <br />
    {/each}

    <p>
      <button type="submit">Ustvari</button>
    </p>
  </form>
</div>
