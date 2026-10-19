# Licenze e provenienza dei dati

La [licenza MIT](LICENSE) del codice originale del progetto non si applica ai dati geografici, ai calendari o ai componenti di terze parti. Questi materiali mantengono le rispettive licenze.

La copia pubblicata è archiviata in `docs/assets/data/`: `streets.json` contiene tratti e calendari, `street-network.json` le geometrie aggiuntive senza calendario, `districts.geojson` i quartieri, `river.geojson` l'Arno e `labels.json` le etichette. [`metadata.json`](docs/assets/data/metadata.json) conserva il riepilogo delle fonti, delle date, delle licenze e dei conteggi. La separazione in file distinti non modifica le licenze né la data della copia; il sito carica questi file locali senza aggiornare automaticamente le fonti.

## Calendari di pulizia strade

- Dataset: [Pulizia Strade](https://opendata.comune.fi.it/page_dataset_show?id=pulizia-strade).
- Fonte: Comune di Firenze — Direzione Sistemi Informativi; calendari forniti da Alia.
- Risorsa: [GeoJSON alia_spazzamenti](https://datigis.comune.fi.it/json/alia_spazzamenti.json).
- Copia elaborata: 19 ottobre 2026; timestamp del file originale `2026-10-19T01:03:03.105Z`.
- Licenza specifica inclusa con il dataset: **Creative Commons Attribuzione — Non Commerciale — Condividi allo stesso modo 4.0 Internazionale (CC BY-NC-SA 4.0)**.
- [Sintesi della licenza](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.it) e [testo legale](https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode.it).

I dati elaborati vengono distribuiti con la stessa licenza CC BY-NC-SA 4.0. Il riutilizzo richiede attribuzione, indicazione delle modifiche, uso non commerciale e rispetto della clausola di condivisione allo stesso modo. La licenza MIT del software non elimina queste condizioni.

Modifiche apportate: raggruppamento dei record per codice del tratto, rimozione dei duplicati esatti, conservazione di tutti i turni distinti, codifica compatta dei nomi e dei calendari, arrotondamento delle coordinate WGS84 a cinque decimali. I 6.269 record originali diventano 6.249 coppie tratto/turno su 5.576 tratti e 1.537 nomi. Il confronto delle proprietà dei file GeoJSON e SHP originali e dei dati elaborati conferma che tutti i tratti e i turni distinti sono conservati.

La data del file indica la generazione della copia, non certifica l'ultima modifica di ciascun calendario. Il sito non aggiorna automaticamente il dataset. Le cadenze pari/dispari prive di definizione e gli orari di inizio/fine coincidenti vengono segnalati come da verificare.

## Strade aggiuntive senza calendario

- Dataset: [Tratti stradali](https://opendata.comune.fi.it/page_dataset_show?id=73025d49-66ce-4906-93b8-1c4bc8d64234).
- Fonte: Comune di Firenze — Servizio Statistica e Toponomastica.
- Risorsa: [trattistradali.zip — Shapefile](https://datigis.comune.fi.it/shp/trattistradali.zip).
- Licenza: **CC BY 4.0** — [sintesi](https://creativecommons.org/licenses/by/4.0/deed.it) e [testo legale](https://creativecommons.org/licenses/by/4.0/legalcode.it).
- Copia acquisita il 19 ottobre 2026; modifica indicata nei metadati attuali della fonte: `2026-10-19T01:30:07`.

Lo Shapefile originale comprende 10.290 geometrie lineari e 2.438 nomi. `street-network.json` contiene soltanto le geometrie dei nomi completamente assenti da `streets.json`, selezionate mediante confronto dei nomi normalizzati, comprese le preposizioni. I conteggi finali della selezione sono nel campo `coverage` di [`metadata.json`](docs/assets/data/metadata.json).

Modifiche apportate: conversione delle geometrie da Monte Mario / Italy zone 1 (EPSG:3003), con la trasformazione del file PRJ originale, a WGS84 (EPSG:4326); arrotondamento delle coordinate pubblicate a cinque decimali e codifica compatta dei nomi e delle geometrie. Gli identificativi `ID` e `PK_ID` di questa fonte sono diversi dai `cod_arco` dei calendari e non vengono usati per associare i due dataset.

Queste geometrie sono distribuite con licenza CC BY 4.0 e non includono turni di pulizia. Sono mostrate come **calendario non disponibile**: l'assenza di un calendario non equivale all'assenza di lavaggio o di divieti di sosta. I dati originali di pulizia e la loro licenza restano invariati.

## Quartieri ed etichette

- Dataset: [Aree quartieri](https://opendata.comune.fi.it/page_dataset_show?id=5e08844a-c0d8-4d64-a3b2-d1ab58d9283f).
- Fonte: Comune di Firenze.
- Risorsa: [quartieri.kmz](https://datigis.comune.fi.it/kml/quartieri.kmz).
- Licenza: **CC BY 4.0** — [sintesi](https://creativecommons.org/licenses/by/4.0/deed.it), [testo legale](https://creativecommons.org/licenses/by/4.0/legalcode.it).
- Copia acquisita il 19 ottobre 2026; data di modifica indicata nei metadati della fonte: 16 febbraio 2012.

Modifiche: conversione da KML a GeoJSON WGS84, coordinate a sei decimali, orientamento degli anelli per la proiezione cartografica. Le cinque etichette utilizzano i punti pubblicati nella stessa risorsa.

## Arno

- Dataset: [Reticolo fluviale — Sistema delle Acque](https://opendata.comune.fi.it/page_dataset_show?id=84569d87-0b14-404e-adea-fd486c0a50b8).
- Pubblicazione: Comune di Firenze — Direzione Sistemi Informativi.
- Titolare indicato dalla fonte: Autorità di Bacino del fiume Arno.
- Risorsa: [reticolo_fluviale.kmz](https://datigis.comune.fi.it/kml/reticolo_fluviale.kmz).
- Licenza: **CC BY 4.0** — [sintesi](https://creativecommons.org/licenses/by/4.0/deed.it), [testo legale](https://creativecommons.org/licenses/by/4.0/legalcode.it).
- Copia acquisita il 19 ottobre 2026; data di modifica indicata nei metadati della fonte: 16 gennaio 2013.

Modifiche: selezione dei 17 elementi con denominazione `FIUME ARNO`, conversione da KML a GeoJSON WGS84 e coordinate a sei decimali.

## Attribuzione per il riutilizzo

Formula proposta, da accompagnare ai link alle fonti e alle licenze:

> Calendari di pulizia: Comune di Firenze / dati Alia, CC BY-NC-SA 4.0, copia del 19 ottobre 2026 rielaborata dal progetto Pulizia strade a Firenze. Strade aggiuntive senza calendario: Comune di Firenze / Servizio Statistica e Toponomastica, CC BY 4.0. Quartieri: Comune di Firenze, CC BY 4.0. Arno: Comune di Firenze / Autorità di Bacino del fiume Arno, CC BY 4.0. Coordinate arrotondate e dati convertiti per la visualizzazione.

L'attribuzione non implica approvazione del progetto da parte degli enti citati. Il progetto non distribuisce né autorizza l'uso dei loro loghi. Le licenze complete prevalgono su questa descrizione.
