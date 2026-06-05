# Digitaalne Kultuuripesa v14

Versioon v14 lisab juhendaja / kollektiivijuhi lihtvormi e-post + PIN kontrolliga.

## Uus v14-s

- Juhendaja vaade: `Töötajale` → `Ava juhendaja vorm`.
- Juhendaja autentimine e-posti ja isikliku PIN-koodiga.
- Näidisjuhendajad:
  - `juhendaja@example.com` / `4821`
  - `kasitoo@example.com` / `7394`
- Juhendaja saab esitada proovi, lisaproovi, sündmuse, prooviaja muudatuse või tühistamise soovi.
- Sisestus läheb Google Sheeti staatuses `ootel`.
- Juhataja/admin näeb sisestust PIN-koodiga töövaates ja saab selle kinnitada või tühistada.
- Kinnitamisel ilmub kirje avalikku ruumikalendrisse ning hakkab ruumi blokeerima.

## Paigaldus GitHubis

Asenda vähemalt:

```text
src/App.jsx
src/data.js
```

Kuna v14 muudab ka Apps Scripti, asenda ka:

```text
google/booking-apps-script.gs
```

Google Apps Scriptis tee pärast koodi asendamist:

```text
Save → Deploy → Manage deployments → Edit → New version → Deploy
```

`package-lock.json` jäta GitHubist välja.

## Juhendajate haldus

Apps Script loob Google Sheeti lehe `Juhendajad`, kui seda pole veel olemas. Sealt saad muuta juhendajate e-posti, PIN-i, kollektiivi, ruumi ja aktiivsust.

Veerud:

```text
Juhendaja ID | Nimi | E-post | PIN | Kollektiiv | Rahvamaja | Ruum | RoomID | Aktiivne
```

