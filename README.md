# Kultuuripesa

Konguta ja Rannu rahvamajade ruumikalender ning broneeringusoovide töövoog. Reacti veeb töötab nii arvutis kui telefonis. Google Apps Script salvestab soovid Google Sheeti ja saadab e-kirju.

## Praegune seis

See on kasutuselevõtu kandidaat, mitte kontrollitud tootmisteenus. Avalik kalender loeb ruumikasutuse kirjeid ilma klientide kontaktandmeteta. Broneeringusoov läheb ootele; töötaja saab selle kinnitada. Veeb kontrollib pärast saatmist, kas kirje jõudis Sheeti. Kui ühendus ei tööta, broneerimist ei avata.

## Enne kasutuselevõttu

1. Kinnita tegelikud ruumid, lahtiolekuajad, rendihinnad, lisateenused ja rahvamajade kontaktid failis `src/data.js`. Praegune sisu sisaldab kontrollimata hindu ja kirjeldusi. Kontakti vaates on praegu ainult e-post ja üldised asukohad, sest kinnitatud telefoninumbrit ei ole.
2. Kontrolli `google/booking-apps-script.gs` alguses Sheeti ID, e-posti aadressid ja organisatsiooni nimi. Apps Scripti projektis määra **Script Properties → DIRECTOR_PIN** ja **ADMIN_PIN** erinevate pikkade juhuslike väärtustena. Mõlemad rollid võivad broneeringuid kinnitada; server määrab rolli sisestatud väärtuse järgi. Ära kasuta varem avaldatud 2026 PIN-i.
3. Käivita Apps Scripti redaktorist `testSetup`, anna vajalikud Sheetsi ja MailAppi õigused. Lisa lehele `Juhendajad` päris juhendajad ning nende isiklikud erinevad PIN-id ja lubatud RoomID-d. Näidiskontosid automaatselt enam ei looda.
4. Salvesta kood ja loo Apps Scriptis **uus juurutusversioon** veebirakendusena. Kontrolli `src/data.js` välja `appsScriptUrl`, ehita veeb uuesti ja avalda see GitHub Pagesis. Vana avaldatud Apps Scripti versioon jääb muidu tööle.
5. Katseta päris telefonis ja arvutis kogu teekonda: avalik kalender → broneeringusoov → kiri → töölaud → kinnitamine → avalik kalender → kinnituskiri; juhendaja soov → kinnitamine; tühistamine; katkestatud ühendus. Kasuta testkirjeid ja eemalda need pärast.
6. Koosta ja avalda tegelikud ruumikasutuse tingimused ning isikuandmete töötlemise teave. Vormis olev lühike üldtekst ei asenda neid. Lepi kokku, kes kontrollib broneeringuid ja vastab soovidele.

## Teadaolevad piirid

- Apps Scripti JSONP ja PIN-i põhine ligipääs ei ole piisav pikaajaliseks tootmiskasutuseks, kui töölaud sisaldab klientide isikuandmeid. PIN liigub päringu URL-is. Enne pärisklientide andmete kasutamist tuleb töölaud viia tugevama sisselogimisega teenusesse ja piirata ligipääs rollide kaupa.
- Server kontrollib salvestamisel ja kinnitamisel ruumi, kuupäeva, kellaaegu ja puhvritega kattuvusi. Salvestuslukk kaitseb samaaegsete päringute eest. Korduvate proovide seeria salvestatakse kirjehaaval; katkestusel kuvatakse õnnestunud salvestuste arv.
- Sündmuste ja ringide sisuhaldus puudub: senised vanad näidissündmused ei ilmu avalikus vaates, kuni päris andmete allikas ja sisestus on loodud.
- Hinnad, ruumide andmed, fotod ja tingimused vajavad vastutava inimese kinnitust. Praegu ei tohiks seda pidada ametlikuks hinnakirjaks.

## Majade lisamine

Praegu on aktiivsed Konguta (`konguta`) ja Rannu (`rannu`). Puhja (`puhja`) ja Rõngu (`rongu`) on seadistuses olemas, kuid mitteaktiivsed.

Lisa `src/data.js` majale kinnitatud kontaktandmed (`email`, `phone`), kirjeldus ja ruumid. Seo iga ruum maja püsiva `houseId` väärtusega. Alles seejärel muuda maja `active: true`. Majade vaade, kontaktid ja sündmuste filtrid lähtuvad aktiivsete majade loendist. Puuduva majakontakti korral suunab kiri üldkontaktile.

`npm run build` uuendab automaatselt Apps Scripti faili alguses olevat ruumiseadistust. Pärast majade või ruumide muutmist juuruta nii uus veebikooste kui ka uus `google/booking-apps-script.gs` versioon. Käsitsi lisatud Sheet-kirjed peavad kasutama õiget RoomID-d. Tundmatuid ruume ei seostata automaatselt mõne teise majaga.

## Kontrollid

`npm test` kontrollib majade aktiivsust, rollikontrolli, vigaseid kuupäevi ja aegu, serveri puhvriarvutust, kattuvusi, avaliku päringu andmete piirangut ja valemisisestuste neutraliseerimist. Need on kohalikud testid asendatud Google'i teenustega, mitte tõend juurutatud teenuse toimimise kohta.

CSS ehitatakse veebiga kaasa, mitte ei laadita Tailwindi välisest skriptist. Väikese ekraani vormitekstid on vähemalt 16 px ja alumine navigeerimine arvestab telefoni ekraani turvaalaga. Tegelik brauseri visuaalne kontroll on veel tegemata, sest testikeskkonna brauser ei saanud kohaliku proovivaatega ühendust.

## Arendus

`npm install` ja `npm run dev`. Tootmiskooste: `npm run build`. GitHub Pages kasutab suhtelist baasaadressi (`vite.config.js`).
