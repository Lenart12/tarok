<script lang="ts">
  import { Realizacija } from '$lib/tarok';
  export let id: string;
  export let value: Realizacija;
</script>

<input type="radio" bind:group={value} value={Realizacija.Izgubljena} id="{id}_izgubljeno" />
<label for="{id}_izgubljeno">Izgubljeno</label>
<input type="radio" bind:group={value} value={Realizacija.Brez} id="{id}_brez" />
<label for="{id}_brez">Brez</label>
<input type="radio" bind:group={value} value={Realizacija.Narejena} id="{id}_narejeno" />
<label for="{id}_narejeno">Narejeno</label>
