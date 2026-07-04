<script lang="ts">
  import { account } from '$lib/session';

  export let data;

  $: me = $account?.id;
</script>

<svelte:head>
  <title>Lestvica - Tarok</title>
</svelte:head>

<div class="container mx-auto p-8 px-0 md:px-8 space-y-8">
  <div class="card px-2 md:px-8 py-4">
    <div class="card-header"><h1 class="h2">Lestvica</h1></div>
    <div class="p-2 md:p-4 space-y-2">
      <p class="text-sm opacity-75">
        Ocena moči igralcev (elo) povezanih računov. Vsaka odigrana igra premakne oceno glede na
        pričakovan izid — presenetljive in težje zmage štejejo več. Igralci z manj kot 30 igrami so
        še začasni.
      </p>

      {#if data.established.length === 0 && data.provisional.length === 0}
        <p class="opacity-60">Še ni ocen. Povežite račun s sobo in odigrajte nekaj iger.</p>
      {:else}
        {#if data.established.length > 0}
          <table class="table table-compact">
            <thead>
              <tr>
                <th class="!text-right w-10">#</th>
                <th>Igralec</th>
                <th class="!text-right">Ocena</th>
                <th class="!text-right">Najvišja</th>
                <th class="!text-right">Iger</th>
              </tr>
            </thead>
            <tbody>
              {#each data.established as row, i (row.account_id)}
                <tr class={row.account_id === me ? '!bg-primary-500/20' : ''}>
                  <td class="!text-right opacity-60">{i + 1}</td>
                  <td class="font-semibold">{row.display_name}</td>
                  <td class="!text-right font-bold">{row.rating}</td>
                  <td class="!text-right opacity-60">{row.peak}</td>
                  <td class="!text-right opacity-60">{row.games}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}

        {#if data.provisional.length > 0}
          <p class="text-sm opacity-60 pt-4">Začasne ocene (manj kot 30 iger)</p>
          <table class="table table-compact">
            <tbody>
              {#each data.provisional as row (row.account_id)}
                <tr class={row.account_id === me ? '!bg-primary-500/20' : ''}>
                  <td class="w-10"></td>
                  <td class="font-semibold">
                    {row.display_name}
                    <span class="badge variant-soft ml-1">začasno</span>
                  </td>
                  <td class="!text-right font-bold opacity-75">{row.rating}</td>
                  <td class="!text-right opacity-60">{row.peak}</td>
                  <td class="!text-right opacity-60">{row.games}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      {/if}
    </div>
  </div>
</div>
