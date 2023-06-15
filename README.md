# Tarok

# Deljene sobe štetja

Soba ima:
Ob kreaciji:

- Identifikator (pridevnikžival\d{4})
- Ime sobe (npr. Tarok v Baza bar)
- Št igralcev (3, 4, 5)
- Imena igralcev

Sredi igre:

- Mešalec (Trenutni)
- Rezultati:
  - Zapis:
    - Vrsta igra
    - Igralec
    - Rufan igralec
    - +- Točke za vsakega igralca
    - +- Radelci za vsakega igralca

Vsaka sprememba pošlje spremembo, veljavna sprememba je samo mešalec ali rezultat

# Lokalna soba

Brez shranjevanje in obnavljanja stanja

# Shranjevanje rezultatov

Sobe se ne brišejo, shranjene v json dokument, id shranjene sobe so zapisane v local storage in prikazane napravi.
Shranijo se vsakemu, ki obišče sobo

./igre/radikalnasova2313

# Tockovanje

IGRE
trojka 10 + razlika
dvojka 30 + razlika
enka 50 + razlika
berač (brez talona) 70
pikolo
zwikolo
solo brez talona 80 + razlika
tri – nap. barvni valat 125
dva – nap. barvni valat 150
ena – nap. barvni valat 175
brez – nap. barvni valat 250
tri – napovedani valat 250
dva – napovedani valat 300
ena – napovedani valat 350
brez talona – nap. valat 500
klop

Točkovanje igre se generira iz json formata

RENONS
ročno točkovanje
+- tocke
+- radelc
<-> mesalec

TOCKE
Ostale realizacije in napovedi: Točke
kralji 10 (napovedani 20)
trula 10 (napovedana 20)
pagat ultimo 25 (napovedani 50)
valat (tihi) 50 (napovedani: glej pod igre)

# Stetje

Pet gumbov

1 2 3 4 5

izbiras karte po 3

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
