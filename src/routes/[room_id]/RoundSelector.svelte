<script lang="ts">
  import { RoundType } from '$lib/tarok';
  export let value: RoundType | undefined;
  const radios = [
    [
      { type: RoundType.Tri, display: 'Tri' },
      { type: RoundType.Dva, display: 'Dva' },
      { type: RoundType.Ena, display: 'Ena' },
    ],
    [
      { type: RoundType.SoloTri, display: 'Solo tri' },
      { type: RoundType.SoloDva, display: 'Solo dva' },
      { type: RoundType.SoloEna, display: 'Solo ena' },
      { type: RoundType.SoloBrez, display: 'Solo brez' },
    ],
    [
      { type: RoundType.Klop, display: 'Klop' },
      { type: RoundType.Pikolo, display: 'Pikolo' },
      { type: RoundType.Berac, display: 'Berač' },
      { type: RoundType.OdprtiBerac, display: 'Odprti berač' },
    ],
    [
      { type: RoundType.BarvniValat, display: 'Barvni valat' },
      { type: RoundType.Valat, display: 'Valat' },
    ],
    [
      { type: RoundType.Rocno, display: 'Ročno' },
      { type: RoundType.Renons, display: 'Renons' },
    ],
  ];
</script>

<div class="flex content-stretch flex-wrap">
  {#each radios as group}
    <div class="btn-group flex-1 content-stretch inline-flex variant-soft m-2 min-w-fit">
      {#each group as radio}
        {@const id = `Type${RoundType[radio.type]}`}
        <label
          for={id}
          class="py-2 !px-1 flex-1 flex content-center items-center"
          class:variant-filled-primary={value === radio.type}
        >
          <input hidden type="radio" {id} bind:group={value} value={radio.type} />
          <p class="inline-block flex-1 text-center !border-0">{radio.display}</p>
        </label>
      {/each}
    </div>
  {/each}
</div>
