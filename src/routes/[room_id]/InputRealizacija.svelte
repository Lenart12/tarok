<script lang="ts">
  import { Realizacija } from '$lib/tarok';
  export let id: string;
  export let value: Realizacija;

  const realizacije = [
    { type: Realizacija.Izgubljena, display: 'Izgubljeno', variant: 'variant-filled-error' },
    { type: Realizacija.Brez, display: 'Brez', variant: 'variant-filled-secondary' },
    { type: Realizacija.Narejena, display: 'Narejeno', variant: 'variant-filled-primary' },
  ];
</script>

<div class="btn-group variant-soft m-2 w-full">
  {#each realizacije as realizacija}
    {@const radio_id = `${id}_${Realizacija[realizacija.type]}`}
    <label
      for={radio_id}
      class={'py-2 px-3 flex-1 flex items-center ' + (value === realizacija.type ? realizacija.variant : '')}
    >
      <input hidden type="radio" id={radio_id} bind:group={value} value={realizacija.type} />
      <p>{realizacija.display}</p>
    </label>
  {/each}
</div>
