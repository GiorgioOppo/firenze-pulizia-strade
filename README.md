# Pulizia strade a Firenze

Mappa interattiva dei calendari di lavaggio stradale, per confrontare i turni con il periodo in cui si intende lasciare l'auto.

Il sito permette di impostare arrivo e partenza, cercare una strada e selezionare i singoli tratti. Le strade prive di calendario sono indicate come **calendario non disponibile**. I turni pari/dispari non documentati e gli orari incongruenti vengono segnalati come da verificare, senza inventare una cadenza.

## Sito

[Apri la mappa su GitHub Pages](https://giorgiooppo.github.io/firenze-pulizia-strade/).

GitHub Pages pubblica la cartella `docs` del ramo `main`. Questa è l'unica sorgente del sito: HTML, CSS, JavaScript e dati sono in file distinti. Non occorrono un server applicativo, chiavi API o un processo di compilazione.

## Struttura del progetto

```text
docs/
├── index.html              # Pagina e struttura semantica
├── assets/
│   ├── css/
│   │   ├── base.css        # Tema, tipografia e layout
│   │   └── map.css         # Mappa e pannelli
│   ├── js/
│   │   ├── app.js          # Avvio e coordinamento
│   │   ├── calendar.js     # Ricorrenze e conflitti con la sosta
│   │   ├── data.js         # Caricamento e decodifica dei dati
│   │   ├── map.js          # Disegno della mappa e navigazione
│   │   ├── ui.js           # Dettagli e selettore dei tratti
│   │   ├── format.js       # Testi, date e orari
│   │   └── storage.js      # Preferenze locali
│   └── data/
│       ├── streets.json    # Geometrie e calendari dei tratti
│       ├── street-network.json # Strade aggiuntive senza calendario
│       ├── districts.geojson
│       ├── river.geojson
│       ├── labels.json
│       └── metadata.json   # Conteggi, provenienza e licenze
├── .nojekyll
└── robots.txt
scripts/
├── check-site.mjs          # Controlli della struttura pubblicabile
└── import-street-network.mjs # Import dello stradario già convertito in WGS84
tests/
├── calendar.test.js
├── storage.test.js
└── data.test.js
package.json               # Comandi di sviluppo, senza dipendenze npm
.github/                   # Modelli per issue e pull request
```

I moduli JavaScript usano import relativi; i dati vengono caricati dagli archivi locali in `docs/assets/data/`. I collegamenti funzionano anche nel sottopercorso del progetto su GitHub Pages. D3 7.9.0, caricato da CDN, è l'unica libreria esterna.

## Sviluppo locale

Per i controlli automatici serve **Node.js 20 o successivo**; per il server locale serve **Python 3**. Non è necessario eseguire `npm install`.

```sh
npm run check
npm test
npm run serve
```

Aprire [http://localhost:8000/](http://localhost:8000/) nel browser. `check` verifica la struttura e i riferimenti del sito; `test` esegue i test con il runner integrato di Node.js. Nessuno dei due comandi genera o compila file.

Il comando `serve` equivale a:

```sh
python3 -m http.server 8000 --directory docs
```

Per caricare D3 è necessaria una connessione Internet. La cartella `work/`, se presente, è ignorata da Git e non è necessaria per eseguire o pubblicare il sito.

## Dati e limiti

La copia dei dati è stata generata il **19 ottobre 2026**. Il sito non si aggiorna automaticamente. I 6.269 record originali di pulizia sono raggruppati in 5.576 tratti e 1.537 nomi, conservando tutti i turni distinti per ciascun tratto. Il confronto con GeoJSON e SHP originali conferma che nessun tratto o calendario è stato escluso dall'importazione.

Il dataset di pulizia non comprende tutti i nomi stradali della città. `street-network.json` aggiunge le geometrie del dataset comunale **Tratti stradali** per i nomi completamente assenti dai calendari, anche nel centro storico. La selezione confronta i nomi normalizzati; non associa i codici dei due dataset e non attribuisce calendari ai nuovi tratti. I conteggi della copertura integrata sono riportati nel campo `coverage` di [`metadata.json`](docs/assets/data/metadata.json).

**Calendario non disponibile** significa che non ci sono dati di pulizia per quella strada. È diverso da **nessun lavaggio nell'intervallo**, che deriva dal confronto tra un calendario disponibile e il periodo di sosta scelto. Nessuno dei due stati certifica che si possa parcheggiare.

La ricerca riconosce i nomi anche senza preposizioni e con apostrofi diversi: per esempio, `piazza Duomo` trova `PIAZZA DEL DUOMO`.

Le date e gli orari vengono interpretati come ora locale di Roma. Un lavaggio martedì dalle 00:00 alle 06:00 riguarda la notte fra lunedì e martedì.

La mappa riguarda il lavaggio stradale: non indica disponibilità degli stalli, autorizzazioni ZTL, lato strada, eccezioni festive o altri divieti. Fa fede la segnaletica sul posto. Consultare anche gli [avvisi ufficiali Plures](https://www.plures.it/it-it/cittadini/cittadini/servizi/servizi-ai-cittadini/spazzamento-strade).

Le scelte di consultazione vengono conservate in `localStorage`; sono lette anche le preferenze salvate nel formato precedente. Nessun dato personale viene inviato dall'applicazione; il caricamento della pagina e di D3 comporta le normali richieste a GitHub Pages e a jsDelivr.

## Fonti e licenze

Il codice e la documentazione originali del progetto sono distribuiti con [licenza MIT](LICENSE). I dati nei file JSON e GeoJSON mantengono le licenze riportate di seguito: la MIT non autorizza un uso commerciale dei calendari. Provenienza, trasformazioni e ambito delle licenze sono descritti in [DATA_LICENSE.md](DATA_LICENSE.md) e riassunti in [`metadata.json`](docs/assets/data/metadata.json); la libreria esterna è elencata in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

- [Pulizia Strade — Comune di Firenze / dati Alia](https://opendata.comune.fi.it/page_dataset_show?id=pulizia-strade), **CC BY-NC-SA 4.0**. La rappresentazione elaborata mantiene la stessa licenza; sono stati rimossi i duplicati esatti e arrotondate le coordinate a circa un metro.
- [Tratti stradali — Comune di Firenze / Servizio Statistica e Toponomastica](https://opendata.comune.fi.it/page_dataset_show?id=73025d49-66ce-4906-93b8-1c4bc8d64234), **CC BY 4.0**. Dallo Shapefile sono estratte soltanto le geometrie aggiuntive dei nomi assenti nei calendari, senza dedurre turni di pulizia.
- [Aree quartieri — Comune di Firenze](https://opendata.comune.fi.it/page_dataset_show?id=5e08844a-c0d8-4d64-a3b2-d1ab58d9283f), **CC BY 4.0**.
- [Reticolo fluviale — Comune di Firenze / Autorità di Bacino del fiume Arno](https://opendata.comune.fi.it/page_dataset_show?id=84569d87-0b14-404e-adea-fd486c0a50b8), **CC BY 4.0**; selezionati i tratti denominati FIUME ARNO.

Testi delle licenze: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) e [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Progetto indipendente, non un servizio ufficiale del Comune di Firenze o di Plures.

## Partecipare e ricevere supporto

- [Come contribuire](CONTRIBUTING.md): procedura e verifiche per le modifiche.
- [Contributori e attribuzioni](CONTRIBUTORS.md).
- [Codice di condotta](CODE_OF_CONDUCT.md).
- [Supporto e segnalazioni](SUPPORT.md); [apri una issue](https://github.com/GiorgioOppo/firenze-pulizia-strade/issues/new/choose) per bug, correzioni dei dati o proposte.
- [Sicurezza](SECURITY.md): istruzioni per segnalare problemi senza esporre informazioni sensibili.
- [Registro delle modifiche](CHANGELOG.md).

Le pull request dispongono di un modello dedicato. I file `.editorconfig` e `.gitattributes` fissano codifica UTF-8 e terminazioni di riga coerenti.
