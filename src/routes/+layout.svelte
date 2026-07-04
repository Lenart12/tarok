<script>
  import '@skeletonlabs/skeleton/themes/theme-skeleton.css';
  import '@skeletonlabs/skeleton/styles/skeleton.css';
  import '../app.postcss';
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import { account } from '$lib/session';
  import { AppShell, AppBar } from '@skeletonlabs/skeleton';
  import { LightSwitch } from '@skeletonlabs/skeleton';
  import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';

  import { storePopup } from '@skeletonlabs/skeleton';
  storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });

  $: login_href = $page.url.pathname.startsWith('/login')
    ? '/login'
    : `/login?redirect=${encodeURIComponent($page.url.pathname)}`;

  afterNavigate(async () => {
    try {
      account.set((await (await fetch('/api/me')).json()).account);
    } catch {
      account.set(null);
    }
  });
</script>

<AppShell>
  <svelte:fragment slot="header">
    <!-- App Bar -->
    <AppBar>
      <svelte:fragment slot="lead">
        <a href="/">
          <strong class="text-xl uppercase">Tarok</strong>
        </a>
      </svelte:fragment>
      <svelte:fragment slot="trail">
        <LightSwitch />
        {#if $account}
          <a class="btn btn-sm variant-ghost-surface" href="/profil">{$account.display_name}</a>
        {:else}
          <a class="btn btn-sm variant-ghost-surface" href={login_href}>Prijava</a>
        {/if}
        <a
          class="btn btn-sm variant-ghost-surface"
          href="https://github.com/Lenart12/tarok"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </svelte:fragment>
    </AppBar>
  </svelte:fragment>

  <slot />
</AppShell>
