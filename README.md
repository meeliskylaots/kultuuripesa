# Rannu & Konguta digitaalne kultuuripesa

See on kiire React + GitHub Pages prototüüp Rannu ja Konguta rahvamajade avaliku vaate ning sisselogitud sisuhalduse loogika testimiseks.

Prototüüp sisaldab:

- avalikku sündmuste vaadet;
- ringide ja tegevuste vaadet;
- ruumide rendi infot;
- rahvamajade tutvustust;
- töötaja / juhendaja vaate prototüüpi;
- rollipõhise sisuhalduse näidet;
- kinnitamise töövoo näidet;
- GitHub Pages automaatset avaldamist;
- GitHub Issue vorme muudatussoovide kogumiseks.

## 1. Kiire käivitamine arvutis

Kui Node.js on olemas:

```bash
npm install
npm run dev
```

Seejärel ava brauseris aadress, mida Vite näitab.

## 2. GitHubi panemine

1. Loo GitHubis uus repo, näiteks `digitaalne-kultuuripesa`.
2. Laadi selle ZIP-faili sisu reposse.
3. Ava repo seaded: `Settings -> Pages`.
4. Vali `Build and deployment -> Source -> GitHub Actions`.
5. Tee commit `main` harusse.
6. GitHub Actions ehitab ja avaldab lehe automaatselt.

Leht tekib kujul:

```text
https://SINU-KASUTAJANIMI.github.io/digitaalne-kultuuripesa/
```

Kui kasutad teist repo nime, töötab projekt tavaliselt ikka, sest `vite.config.js` kasutab suhtelist `base: './'` seadistust.

## 3. Kuidas sisu praegu muuta

Esimeses versioonis asub näidissisu failis:

```text
src/data.js
```

Sealt saab muuta:

- sündmusi;
- ringe ja kollektiive;
- rahvamajade infot;
- ruumide infot;
- kasutajarolle.

Avalikus vaates kuvatakse ainult sündmusi, millel on:

```js
status: 'published',
public: true
```

## 4. Kuidas kollektiivide juhid saavad piloodis muudatusi esitada

GitHubis on olemas Issue Forms mallid:

- `Prooviaja muudatus`
- `Sündmuse lisamine`
- `Ruumibroneeringu soov`
- `Vea või parandusettepaneku teade`

Need asuvad kaustas:

```text
.github/ISSUE_TEMPLATE/
```

Piloodis saab kollektiivi juht teha GitHub Issue kaudu muudatussoovi. Rahvamaja juht vaatab selle üle ja muudab vastavalt sisu failis `src/data.js` või hilisemas lahenduses Google Sheetis.

## 5. Google Sheets järgmise sammuna

Kaustas `google/` on fail:

```text
google/apps-script-starter.gs
```

See on algne Google Apps Script, millega saab Google Sheetsist JSON-andmed välja anda. Seda saab kasutada järgmises etapis, et rahvamaja juht ei peaks sisu GitHubis muutma, vaid saaks andmeid hallata Google Sheetsis.

Soovituslikud Google Sheeti lehed:

- `Sundmused`
- `Ringid`
- `Ruumid`
- `Majad`

## 6. Mida see prototüüp veel ei tee

See ei ole veel päris turvalise sisselogimise ja andmebaasiga süsteem. Praegune töötaja vaade on kasutajateekonna ja töövoo testimiseks.

Päris töövahendiks on vaja hiljem lisada üks neist:

- Google Sheets + Apps Script andmeallikana;
- Supabase / Firebase päris sisselogimiseks ja rollipõhisteks õigusteks;
- olemasoleva Elva Kultuuri veebiga liidestamine.

## 7. Piloodi soovituslik eesmärk

Piloodis testi kolme küsimust:

1. Kas tavakodanik leiab sündmused, ringid, ruumid ja kontaktid kiiresti?
2. Kas kollektiivi juht saab aru, kuidas prooviaja muutmine käib?
3. Kas rahvamaja juht saab aru, mida ta peab kinnitama ja mis jõuab avalikku vaatesse?
