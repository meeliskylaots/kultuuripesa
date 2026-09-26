# Avaliku sisu haldamine

Rahvamajade, ruumide ja kollektiivide tutvustust, pildi HTTPS-aadressi, pildi kirjeldust ning lisalinkide aadresse saab muuta töölaual jaotises **Lehe sisu**. Selleks peab juhataja või administraator olema oma kontoga sisse logitud. Kollektiivi juhendaja saab muuta oma kollektiivi infot olemasolevas kollektiivi vaates; muudatus ootab kinnitust.

Salvestamisel luuakse Google Sheeti vahekaart **Avalik sisu**. Põhikanded ja broneeringud jäävad senistesse tabelitesse. Veeb näitab salvestatud sisu ning kasutab puuduvate väljade jaoks lähteandmeid.

## Kasutuselevõtt

1. Kopeeri faili `google/booking-apps-script.gs` **terve sisu** selle Google Sheeti seotud Apps Scripti projekti. Ära lisa seda GitHubi faili ainult juurutamise asemel.
2. Apps Scriptis vali **Deploy → Manage deployments → Edit → New version → Deploy**. Säilita senise veebirakenduse URL.
3. Kui avalik veeb on GitHub Pagesis uuendatud, logi töötajana sisse, ava **Lehe sisu**, vali rahvamaja, ruum või kollektiiv ja salvesta esimene muudatus.
4. Kontrolli teisest brauserist avalikku vaadet ning tee proovibroneering eri ruumidele; kontrolli kinnitamist ja lehe värskendamist.

Pildifaili üleslaadimist see versioon ei sisalda. Pilt peab juba asuma veebis avaliku otseviitega HTTPS-aadressil; Google Drive'i jagamislink ei pruugi töötada pildiaadressina. Ära lisa vormi salajasi paroole ega privaatseid faile.

## Uue HTML-kavandi ühendamine

Apps Scripti avalik `daySchedule` toiming võtab `date=AAAA-KK-PP` ja `roomId` (näiteks `konguta-saal`) ning vastab välja `entries` kaudu. Igal kirjel on `roomId`, `startTime`, `endTime`, `reservedStartTime`, `reservedEndTime` ja `status`. `pending` hõivab samuti ruumi. Server ei väljasta kliendi nime ega sündmuse kirjeldust.

Uue HTML-vormi `submitBooking()` peab saatma POST-päringu toiminguga `submitSiteBooking` järgmiste väljadega: `roomId`, `date`, `startTime`, `endTime`, `clientName`, `clientEmail`, `clientPhone`, `eventDescription`, `clientType`. Tulemust tuleb kontrollida sama `operationStatus` päringuga, mida kasutab Reacti rakendus. Nimi, e-post ja telefon on kohustuslikud; senisele HTML-kavandile tuleb e-posti ja telefoni väljad lisada. Ära kuva teadet „Päring saadetud” enne serveri kinnitust. Kavandi `suur` ja `vaike` ei ole üheselt määratud ruumi ID-d: kasutada tuleb `ROOM_CONFIG` väärtusi. Konguta väikese saali ID-d praeguses ruumide loendis ei ole.

Juhendaja prooviaja muutmise päring kasutab olemasolevat `requestReschedule` toimingut. See nõuab isiklikku seansitokenit, muudetava proovi `bookingId` väärtust ning uut kuupäeva, ruumi ID-d ja kellaaegu. Kinnituse teeb juhataja või administraator `updateStatus` toiminguga. Näidisfaili ainult kuupäeva ja vaba tekstiga vorm ei anna selleks piisavalt andmeid. Näidisfailis kõvakodeeritud `admin` ja `juhendaja` paroole ei tohi avalikule veebilehele lisada.
