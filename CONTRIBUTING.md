# Contribuire

Sono benvenute correzioni ai dati, miglioramenti della mappa e della sua accessibilità, documentazione e segnalazioni riproducibili. Prima di contribuire, leggere il [README](README.md), le [licenze dei dati](DATA_LICENSE.md) e il [codice di condotta](CODE_OF_CONDUCT.md).

## Segnalare un problema

Aprire una [issue](https://github.com/GiorgioOppo/firenze-pulizia-strade/issues) e indicare:

- nome della strada e codice del tratto, se disponibile;
- arrivo e partenza selezionati, con data e ora;
- comportamento osservato e risultato atteso;
- browser e dispositivo, per problemi di interfaccia;
- fonte e data della verifica, per correzioni al calendario.

Una foto leggibile del cartello o un collegamento a una fonte ufficiale può aiutare a verificare una discrepanza. Rimuovere targhe, volti e altri dati personali dalle immagini. Il calendario nel dataset e la segnaletica possono differire: descrivere la differenza senza dedurre automaticamente una nuova regola generale.

## Preparare una modifica

1. Creare un fork e un ramo dedicato alla modifica.
2. Modificare direttamente i file in `docs/`, l'unica sorgente pubblicata del sito. La struttura HTML è in `docs/index.html`, gli stili in `docs/assets/css/`, i moduli JavaScript in `docs/assets/js/` e i dati in `docs/assets/data/`.
3. Eseguire `npm run check` e `npm test`, quindi provare il sito con `npm run serve`. Non è previsto un passaggio di build o di esportazione.
4. Aggiornare la documentazione interessata. Per modifiche ai dati, registrare fonte, data di acquisizione, trasformazioni effettuate e variazioni dei conteggi nel README, in [DATA_LICENSE.md](DATA_LICENSE.md) e in `docs/assets/data/metadata.json`.
5. Aprire una pull request con una breve descrizione del problema, della soluzione e delle verifiche svolte.

La cartella `work/` è ignorata da Git e non è disponibile in un normale clone. Una modifica non deve dipendere da suoi file o da percorsi locali del computer di chi contribuisce.

## Provare il sito

Dalla radice del repository, con Node.js 20 o successivo e Python 3 installati:

```sh
npm run check
npm test
npm run serve
```

Non occorre installare dipendenze npm. `check` controlla la struttura pubblicabile e i riferimenti locali; `test` usa il runner integrato di Node.js per calendario, preferenze e dati. Aggiungere o aggiornare test quando cambia il comportamento di questi moduli. I controlli non producono file compilati.

Aprire [http://localhost:8000/](http://localhost:8000/) nel browser. `serve` avvia `python3 -m http.server 8000 --directory docs`. D3 viene caricato da CDN e richiede una connessione Internet. Riportare nella pull request anche le prove manuali pertinenti alla modifica.

Mantenere relativi gli import, i collegamenti agli asset e i percorsi dei dati, in modo che il sito funzioni nel sottopercorso di GitHub Pages. I dati pubblicati sono file locali: una modifica non deve introdurre aggiornamenti automatici dalle fonti senza documentarne il comportamento.

Per modifiche all'interfaccia, controllare almeno ricerca di una via esistente e di un nome assente, scelta del singolo tratto, zoom, selezione sulla mappa e leggibilità su uno schermo stretto. Verificare anche che i campi e i pulsanti principali siano raggiungibili con la tastiera e che la console del browser non segnali errori.

Per modifiche al calendario, usare turni presenti nei dati e annotare tratto, intervallo e risultato. Controllare:

- una sosta che precede un turno, una che si sovrappone e una che inizia alla sua fine;
- un turno a mezzanotte: martedì 00:00–06:00 corrisponde alla notte tra lunedì e martedì;
- una sosta a cavallo della mezzanotte, confrontata con il calendario del giorno successivo;
- ricorrenze mensili vicino al cambio di mese, compresa la quinta occorrenza quando presente;
- turni pari/dispari senza cadenza documentata e orari con inizio uguale alla fine, che devono restare «da verificare»;
- partenza precedente o uguale all'arrivo e intervalli superiori a 366 giorni, che devono sospendere il calcolo.

I calcoli usano date e ore locali di Roma. Se la modifica riguarda le date, verificare anche con il browser impostato su un altro fuso orario e attorno ai cambi dell'ora legale.

## Dati, attribuzioni e licenze

Conservare tutti i turni distinti associati a un tratto e mantenere esplicite le incertezze del dataset. Non aggiungere dati di cui non sia verificabile la provenienza o che non possano essere redistribuiti con il progetto.

Il codice originale è disciplinato da [LICENSE](LICENSE); i dati JSON/GeoJSON e la libreria esterna seguono le rispettive condizioni descritte in [DATA_LICENSE.md](DATA_LICENSE.md) e [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Contribuire solo materiale che si ha diritto di condividere e indicare nella pull request eventuali attribuzioni richieste.
