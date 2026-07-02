<script lang="ts">
  export let name: string;
  export let count: number;
  export let wins: number;
  export let losses: number;
  export let sum_points = 0;
  export let show_avg = true;
  export let success_label = 'uspeh';

  $: avg = count > 0 ? sum_points / count : 0;
  $: total = wins + losses;
  $: win_pct = total > 0 ? (wins / total) * 100 : 0;
  $: loss_pct = total > 0 ? (losses / total) * 100 : 0;
  $: success = total > 0 ? (wins / total) * 100 : 0;
</script>

<div class="py-2">
  <div class="flex justify-between items-baseline gap-2 mb-1">
    <div class="flex items-baseline gap-3">
      <span class="font-bold">{name}</span>
      <span class="opacity-60 text-sm">{count} rund</span>
    </div>
    {#if show_avg}
      <span class="opacity-60 text-sm">povprečje: {avg.toFixed(1)}</span>
    {/if}
  </div>
  <div class="flex items-center gap-3">
    <div
      class="flex h-6 flex-auto rounded overflow-hidden bg-surface-300-600-token text-xs font-semibold text-white"
    >
      {#if wins > 0}
        <div class="bg-primary-500 flex items-center justify-center" style="width:{win_pct}%">{wins}</div>
      {/if}
      {#if losses > 0}
        <div class="bg-error-500 flex items-center justify-center" style="width:{loss_pct}%">{losses}</div>
      {/if}
    </div>
    <span class="text-sm whitespace-nowrap opacity-75 text-right">{success.toFixed(1)}% {success_label}</span>
  </div>
</div>
