<script lang="ts">
  import { goto } from '$app/navigation';
  import { io } from '$lib/game_connection_client';

  export let data;

  let error_msg: string | undefined;
  let claiming = false;

  async function claim() {
    claiming = true;
    error_msg = undefined;
    const res = await fetch(`/game/${data.room_id}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: data.player_id }),
    });
    claiming = false;
    if (res.ok) {
      io.emit('tarok:claims-updated', data.room_id);
      goto(`/${data.room_id}`);
    } else {
      error_msg = res.status === 409 ? 'To mesto je že prevzel drug igralec.' : 'Prevzem ni uspel.';
    }
  }
</script>

<svelte:head>
  <title>Prevzem mesta - Tarok</title>
</svelte:head>

<div class="container mx-auto p-8 max-w-md">
  <div class="card p-8 space-y-4 text-center">
    <h1 class="h2">Prevzem mesta</h1>
    {#if data.claimed_by_me}
      <p>To mesto (<strong>{data.player_name}</strong>) je že povezano z vašim računom.</p>
      <a class="btn variant-filled-primary" href={`/${data.room_id}`}>Nazaj v sobo</a>
    {:else}
      <p>
        Želite prevzeti mesto igralca <strong>{data.player_name}</strong> v sobi
        <strong>{data.room_title}</strong>?
      </p>
      {#if data.claimed_by_other}
        <aside class="alert variant-filled-warning">
          <div class="alert-message">To mesto je trenutno povezano z drugim računom in ga ne morete prevzeti.</div>
        </aside>
      {:else}
        <button type="button" class="btn variant-filled-primary" on:click={claim} disabled={claiming}>
          To sem jaz
        </button>
      {/if}
      {#if error_msg}
        <aside class="alert variant-filled-error">
          <div class="alert-message">{error_msg}</div>
        </aside>
      {/if}
      <a class="btn variant-soft block" href={`/${data.room_id}`}>Prekliči</a>
    {/if}
  </div>
</div>
