<script lang="ts">
  import { page } from '$app/stores';
  import { enhance } from '$app/forms';

  export let form;

  $: redirect_to = $page.url.searchParams.get('redirect') ?? '/';
</script>

<svelte:head>
  <title>Prijava - Tarok</title>
</svelte:head>

<div class="container mx-auto p-8 max-w-md">
  <div class="card p-8 space-y-4">
    <h1 class="h2">Prijava</h1>
    {#if form?.sent}
      <aside class="alert variant-filled-success">
        <div class="alert-message">
          Na <strong>{form.email}</strong> smo poslali povezavo in kodo za prijavo.
        </div>
      </aside>
      <p class="opacity-75 text-sm">Kliknite povezavo iz e-pošte ali spodaj vnesite 4-mestno kodo.</p>
      <form method="POST" action="?/pin" use:enhance class="space-y-4">
        <input type="hidden" name="redirect" value={redirect_to} />
        <input type="hidden" name="email" value={form.email} />
        <label class="label">
          <span>Koda za prijavo</span>
          <input
            class="input px-2 text-center tracking-[0.5em] text-2xl"
            type="text"
            name="pin"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="4"
            placeholder="0000"
            autocomplete="one-time-code"
            required
          />
        </label>
        {#if form?.error}
          <aside class="alert variant-filled-error">
            <div class="alert-message">{form.error}</div>
          </aside>
        {/if}
        <button type="submit" class="btn variant-filled-primary w-full">Prijava s kodo</button>
      </form>
    {:else}
      <p class="opacity-75 text-sm">
        Vnesite e-poštni naslov in poslali vam bomo povezavo ter kodo za prijavo. Računa vam ni treba ustvariti vnaprej.
      </p>
      <form method="POST" action="?/send" use:enhance class="space-y-4">
        <input type="hidden" name="redirect" value={redirect_to} />
        <label class="label">
          <span>E-poštni naslov</span>
          <input class="input px-2" type="email" name="email" placeholder="ime@primer.si" value={form?.email ?? ''} required />
        </label>
        {#if form?.error}
          <aside class="alert variant-filled-error">
            <div class="alert-message">{form.error}</div>
          </aside>
        {/if}
        <button type="submit" class="btn variant-filled-primary w-full">Pošlji povezavo in kodo</button>
      </form>
    {/if}
  </div>
</div>
