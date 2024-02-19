<script lang="ts">
  import { Napoved } from '$lib/tarok';
  export let id: string;
  export let value: Napoved;

  const napovedi = [
    { type: Napoved.Nenapovedana, display: 'Brez', variant: 'variant-filled-secondary' },
    { type: Napoved.Napovedana, display: 'Napovedano', variant: 'variant-filled-primary' },
  ];
</script>

<div class="btn-group bg-surface-700 m-2 w-full">
  {#each napovedi as napoved}
    {@const radio_id = `${id}_${Napoved[napoved.type]}`}
    <label
      for={radio_id}
      class={'py-2 px-3 flex-1 flex items-center ' + (value === napoved.type ? napoved.variant : '')}
    >
      <input hidden type="radio" id={radio_id} bind:group={value} value={napoved.type} />
      <p>{napoved.display}</p>
    </label>
  {/each}
</div>
