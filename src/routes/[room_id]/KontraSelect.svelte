<script lang="ts">
  import { Kontra } from '$lib/tarok';
  export let id: string;
  export let value: Kontra;

  const kontre = [
    { type: Kontra.Brez, display: 'Brez', variant: 'variant-filled-secondary' },
    { type: Kontra.Kontra, display: 'Kontra', variant: 'variant-filled-primary' },
    { type: Kontra.Rekontra, display: 'Re', variant: 'variant-filled-tertiary' },
    { type: Kontra.Subkontra, display: 'Sub', variant: 'variant-filled-warning' },
    { type: Kontra.Mordkontra, display: 'Mord', variant: 'variant-filled-error' },
  ];
</script>

<div class="btn-group variant-soft m-2 w-full">
  {#each kontre as kontra}
    {@const radio_id = `${id}_${Kontra[kontra.type]}`}
    <label for={radio_id} class={'py-2 px-3 flex-1 flex items-center ' + (value === kontra.type ? kontra.variant : '')}>
      <input hidden type="radio" id={radio_id} bind:group={value} value={kontra.type} />
      <p>{kontra.display}</p>
    </label>
  {/each}
</div>
