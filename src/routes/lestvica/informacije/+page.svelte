<script lang="ts">
  export let data;

  const pct = (x: number) => `${Math.round(x * 100)}%`;
  $: params = data.params;
</script>

<svelte:head>
  <title>Kako deluje ELO - Tarok</title>
</svelte:head>

<div class="container mx-auto p-8 px-0 md:px-8 space-y-8">
  <div class="card px-2 md:px-8 py-4">
    <div class="card-header flex items-center justify-between gap-2">
      <h1 class="h2">Kako deluje ELO ocena</h1>
      <a class="btn btn-sm variant-ghost-surface" href="/lestvica">← Lestvica</a>
    </div>
    <div class="p-2 md:p-4 space-y-4 text-sm">
      <p>
        Vsak povezan račun ima <strong>oceno moči (elo)</strong>. Vsi začnejo pri
        <strong>{params.initial}</strong>. Pred vsako igro sistem iz razlike v oceni napove verjeten izid, po igri pa
        oceno premakne glede na to, koliko se je dejanski izid razlikoval od napovedi. Presenetljive zmage (nad
        močnejšim nasprotnikom) prinesejo več, pričakovane zmage malo. Zaradi tega se sreča pri kartah čez veliko iger
        izniči — ocena sledi znanju, ne posameznemu dobremu deljenju.
      </p>

      <div>
        <h2 class="h4 mb-1">Pričakovani izid</h2>
        <p class="opacity-80">
          Verjetnost zmage rase z razliko v oceni. Enako močna igralca imata vsak 50 %, razlika
          {params.scale} točk pomeni približno 91 % za močnejšega. Formula:
        </p>
        <pre class="pre my-2 text-xs overflow-x-auto">E = 1 / (1 + 10^((nasprotnik − jaz) / {params.scale}))</pre>
        <p class="opacity-80">
          Nova ocena = stara + <strong>K</strong> × (dejanski izid − pričakovani izid), kjer je dejanski izid 1 za zmago
          in 0 za poraz. <strong>K</strong> določa velikost premika: novi igralci (manj kot
          {params.provisional_games} iger) imajo večji K ({params.k_new}) za hitrejšo umeritev, ustaljeni manjšega ({params.k_established}).
          Do {params.provisional_games} iger je ocena označena kot
          <em>začasna</em>.
        </p>
      </div>

      <div>
        <h2 class="h4 mb-1">Ekipe in soigralci</h2>
        <p class="opacity-80">
          Vsaka igra je dvoboj <strong>glavne ekipe</strong> (igralec + morebitni klicani partner) proti
          <strong>obrambi</strong> (ostali). Moč ekipe je povprečje ocen njenih članov, zato so tudi neenake zasedbe
          (npr. 1 proti 3) primerljive. Neprijavljeni (anonimni) igralci se štejejo kot izhodiščna vrednost {params.initial}
          in nimajo svoje ocene.
        </p>
      </div>

      <div>
        <h2 class="h4 mb-1">Težavnost igre šteje</h2>
        <p class="opacity-80">
          Nekatere igre je težje narediti kot druge. Zato pričakovani izid ni vedno 50 % — pri enako močnih igralcih je
          enak temu, kako pogosto se ta tip igre v praksi naredi. Narediti zahtevno igro (npr. berač) prinese več kot
          narediti enostavno igro, ki jo naredijo skoraj vsi. Spodnje vrednosti so
          <strong>trenutni delež uspešno narejenih iger</strong> po tipu (iz vseh odigranih iger) in predstavljajo prav to
          izhodiščno verjetnost.
        </p>
      </div>

      {#if data.priors.length > 0}
        <table class="table table-compact">
          <thead>
            <tr>
              <th>Tip igre</th>
              <th class="!text-right">Vrednost</th>
              <th class="!text-right">Narejeno</th>
              <th class="!text-right">Iger</th>
            </tr>
          </thead>
          <tbody>
            {#each data.priors as p (p.round_type)}
              <tr>
                <td class="font-semibold">{p.name}</td>
                <td class="!text-right opacity-60">{p.base_value}</td>
                <td class="!text-right font-bold">{pct(p.prior)}</td>
                <td class="!text-right opacity-60">{p.sample}</td>
              </tr>
            {/each}
          </tbody>
        </table>
        <p class="text-xs opacity-50">
          »Narejeno« je zglajena verjetnost (upošteva majhne vzorce), zato se lahko rahlo razlikuje od surovega deleža.
          Klop, renons in ročni vpisi tu ne nastopajo.
        </p>
      {/if}

      <div>
        <h2 class="h4 mb-1">Velikost zmage</h2>
        <p class="opacity-80">
          Prepričljiva zmaga (velika razlika glede na vrednost igre) premakne oceno nekoliko bolj — do
          {params.margin_max}× običajnega premika. Igre na razliko (berač, pikolo, valat …) so »narejeno ali ne«, zato
          pri njih velikost ne šteje.
        </p>
      </div>

      <div>
        <h2 class="h4 mb-1">Posebne igre</h2>
        <ul class="list-disc list-inside space-y-1 opacity-80">
          <li>
            <strong>Klop</strong> – vsak zase; razvrsti se po točkah in vsak par igralcev šteje kot mini dvoboj.
          </li>
          <li>
            <strong>Renons</strong> – napaka; krivec dobi pavšalno kazen {params.renons_penalty} točk pri oceni (nasprotniki
            od tega nič).
          </li>
          <li>
            <strong>Neizkoriščeni radelci</strong> – ob koncu sobe (vsaj {params.min_room_rounds} iger) se odstopanje od
            povprečja radelcev v sobi nagradi oz. kaznuje (do {params.radelc_cap} točk).
          </li>
        </ul>
      </div>

      <div>
        <h2 class="h4 mb-1">Zasebnost lestvice</h2>
        <p class="opacity-80">
          Ocene se računajo na strežniku iz shranjenih iger. Na lestvici vidite le igralce, s katerimi ste že kdaj
          igrali v isti sobi.
        </p>
      </div>
    </div>
  </div>
</div>
