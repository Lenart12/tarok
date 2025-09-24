<script lang="ts">
  import {
    round_type_name,
    type GameRound,
    round_type_game,
    NewRoundType,
    klop_slider,
    round_base_value,
    RadelcUsage,
    Realizacija,
    NapovedBonusa,
  } from '$lib/tarok';
  export let id: number;
  export let round: GameRound;
  export let player_names: string[];

  const realizacija = (realizacija: Realizacija, ime: string, vrednost: number, napoved: NapovedBonusa) => {
    const je_napovedano = napoved === NapovedBonusa.Napovedan;

    switch (realizacija) {
      case Realizacija.Narejena:
        return je_napovedano ? `${ime}: +${vrednost * 2} (napovedano)` : `${ime}: +${vrednost}`;
      case Realizacija.Brez:
        return je_napovedano ? `${ime}: -${vrednost * 2} (napovedano)` : ``;
      case Realizacija.Izgubljena:
        return je_napovedano ? `${ime}: -${vrednost * 2} (napovedano)` : `${ime}: -${vrednost}`;
    }
  };

  $: console.log(round);
</script>

<div>
  {#if round.round_type !== undefined}
    {@const round_type = round_type_game(round.round_type)}
    <h3 class="h3"><span class="text-gray-50/25">#{id}</span> {round_type_name(round.round_type)}</h3>
    <h4 class="h4">Obrazložitev</h4>
    {#if round.round !== undefined}
      {@const primary_radelc = round.koriscen_radelc[round.primary_player]}
      {#if round_type === NewRoundType.Rocno}
        Ročni vpis podatkov
      {:else if round_type === NewRoundType.Osnovno}
        Igralec: {player_names[round.primary_player]}
        {#if 'rufan_igralec' in round.round && round.round.rufan_igralec !== undefined}
          <br />
          Rufan igralec: {player_names[round.round.rufan_igralec]}
        {/if}
        <hr />
        {@const round_value = round_base_value(round.round_type)}
        {#if 'razlika' in round.round}
          Vrednost igre: {round.round.razlika[0]}{round_value}
          <br />
          Razlika: {round.round.razlika}
        {/if}
        {@const napoved =
          'napoved' in round.round
            ? round.round.napoved
            : {
                kralji: NapovedBonusa.Brez,
                trula: NapovedBonusa.Brez,
                kralj_ultimo: NapovedBonusa.Brez,
                pagat_ultimo: NapovedBonusa.Brez,
              }}
        {#if 'trula' in round.round}
          {@const trula = realizacija(round.round.trula, 'Trula', 10, napoved.trula)}
          {#if trula !== ''}<br />{trula}{/if}
        {/if}
        {#if 'kralji' in round.round}
          {@const kralji = realizacija(round.round.kralji, 'Kralji', 10, napoved.kralji)}
          {#if kralji !== ''}<br />{kralji}{/if}
        {/if}
        {#if 'kralj_ultimo' in round.round}
          {@const kralj_ultimo = realizacija(round.round.kralj_ultimo, 'Kralj ultimo', 10, napoved.kralj_ultimo)}
          {#if kralj_ultimo !== ''}<br />{kralj_ultimo}{/if}
        {/if}
        {#if 'pagat_ultimo' in round.round}
          {@const pagat_ultimo = realizacija(round.round.pagat_ultimo, 'Pagat ultimo', 25, napoved.pagat_ultimo)}
          {#if pagat_ultimo !== ''}<br />{pagat_ultimo}{/if}
        {/if}
        <hr />
        {#if primary_radelc != RadelcUsage.None}
          {#if primary_radelc == RadelcUsage.Used}
            Radelc uporabljen: ×2
          {:else}
            Radelc upoštevan: ×2
          {/if}
        {/if}

        {#if 'mondfang' in round.round && round.round.mondfang !== undefined}
          Mond vzet: {player_names[round.round.mondfang]}
        {/if}
      {:else if round_type === NewRoundType.Klop}
        {#if 'points' in round.round}
          <table class="divide-y divide-primary-700 w-full">
            <tr>
              <td />
              {#each player_names as player_name}
                <td class="text-center px-2">{player_name}</td>
              {/each}
            </tr>
            <tr>
              <td>Točke</td>
              {#each round.round.points as score}
                <td class="text-right px-2">{klop_slider[score]}</td>
              {/each}
            </tr>
          </table>
        {/if}
      {:else if round_type === NewRoundType.Opravljanje}
        {#if 'opravljeno' in round.round}
          {@const round_value = round_base_value(round.round_type)}
          Igralec: {player_names[round.primary_player]}
          <br />
          Igra {round.round.opravljeno ? 'je' : 'ni'} opravljena: {round_value > 0 ? '+' : ''}{round_value}
          {#if primary_radelc != RadelcUsage.None}
            <br />
            Radelc uporabljen{primary_radelc == RadelcUsage.Used ? ' in izbrisan' : ''}: x2
          {/if}
        {/if}
        <br />
      {/if}
    {:else if round_type === NewRoundType.Renons}
      Renons: {player_names[round.primary_player]}
      <br />
      Vrednost: -70
    {:else}
      <p>Obrazlozitev ni na voljo</p>
    {/if}
    <h4 class="h4">Sprememba točk</h4>
    <table class="divide-y divide-primary-700 w-full">
      <tr>
        <td />
        {#each player_names as player_name}
          <td class="text-center px-2">{player_name}</td>
        {/each}
      </tr>
      <tr>
        <td>Točke</td>
        {#each round.points_change as score}
          {#if score !== 0}
            <td class="text-right px-2">{score == 0 ? '' : score >= 0 ? '+' : ''}{score}</td>
          {:else}
            <td class="text-right px-2" />
          {/if}
        {/each}
      </tr>
      <tr>
        <td>Radelci</td>
        {#each round.radelc_change as radlci}
          <td class="text-right px-2">
            {#if radlci !== 0}
              {radlci == 0 ? '' : radlci >= 0 ? '+' : ''}{radlci}
            {/if}
          </td>
        {/each}
      </tr>
    </table>
  {:else}
    <p>Obrazlozitev ni na voljo</p>
  {/if}
</div>
