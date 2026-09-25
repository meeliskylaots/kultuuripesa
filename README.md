# Kultuuripesa

Rannu ja Konguta rahvamajade ruumikalender ning broneeringusoovide töövoog. Reacti veeb töötab nii arvutis kui telefonis. Google Apps Script salvestab soovid Google Sheeti ja saadab e-kirju.

## Praegune seis

See on kasutuselevõtu kandidaat, mitte kontrollitud tootmisteenus. Avalik kalender loeb ruumikasutuse kirjeid ilma klientide kontaktandmeteta. Broneeringusoov läheb ootele; töötaja saab selle kinnitada. Veeb kontrollib pärast saatmist, kas kirje jõudis Sheeti. Kui ühendus ei tööta, broneerimist ei avata.

## Enne kasutuselevõttu

1. Kinnita tegelikud ruumid, lahtiolekuajad, rendihinnad, lisateenused ja rahvamajade kontaktid failis `src/data.js`. Praegune sisu sisaldab kontrollimata hindu ja kirjeldusi. Kontakti vaates on praegu ainult e-post ja üldised asukohad, sest kinnitatud telefoninumbrit ei ole.
2. Kontrolli `google/booking-apps-script.gs` alguses Sheeti ID, e-posti aadressid ja organisatsiooni nimi. Apps Scripti projektis määra **Script Properties → ADMIN_PIN** pika juhusliku väärtusena. Ära kasuta varem avaldatud 2026 PIN-i.
3. Käivita Apps Scripti redaktorist `testSetup`, anna vajalikud Sheetsi ja MailAppi õigused. Lisa lehele `Juhendajad` päris juhendajad ning nende isiklikud erinevad PIN-id ja lubatud RoomID-d. Näidiskontosid automaatselt enam ei looda.
4. Salvesta kood ja loo Apps Scriptis **uus juurutusversioon** veebirakendusena. Kontrolli `src/data.js` välja `appsScriptUrl`, ehita veeb uuesti ja avalda see GitHub Pagesis. Vana avaldatud Apps Scripti versioon jääb muidu tööle.
5. Katseta päris telefonis ja arvutis kogu teekonda: avalik kalender → broneeringusoov → kiri → töölaud → kinnitamine → avalik kalender → kinnituskiri; juhendaja soov → kinnitamine; tühistamine; katkestatud ühendus. Kasuta testkirjeid ja eemalda need pärast.
6. Koosta ja avalda tegelikud ruumikasutuse tingimused ning isikuandmete töötlemise teave. Vormis olev lühike üldtekst ei asenda neid. Lepi kokku, kes kontrollib broneeringuid ja vastab soovidele.

## Teadaolevad piirid

- Apps Scripti JSONP ja PIN-i põhine ligipääs ei ole piisav pikaajaliseks tootmiskasutuseks, kui töölaud sisaldab klientide isikuandmeid. PIN liigub päringu URL-is. Enne pärisklientide andmete kasutamist tuleb töölaud viia tugevama sisselogimisega teenusesse ja piirata ligipääs rollide kaupa.
- Server ei kontrolli veel kattuvusi ja puhvrite reegleid salvestamise hetkel. Kahe samaaegse soovi või teise kanali kaudu lisatud kirje puhul peab töötaja saadavust enne kinnitamist käsitsi kontrollima.
- Sündmuste ja ringide sisuhaldus puudub: senised vanad näidissündmused ei ilmu avalikus vaates, kuni päris andmete allikas ja sisestus on loodud.
- Hinnad, ruumide andmed, fotod ja tingimused vajavad vastutava inimese kinnitust. Praegu ei tohiks seda pidada ametlikuks hinnakirjaks.

## Arendus

`npm install` ja `npm run dev`. Tootmiskooste: `npm run build`. GitHub Pages kasutab suhtelist baasaadressi (`vite.config.js`).
