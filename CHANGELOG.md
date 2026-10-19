# Registro delle modifiche

## 2026-10-19

### Copertura delle strade e ricerca

- Aggiunte in `street-network.json` le geometrie comunali dei nomi stradali completamente assenti dal dataset di pulizia, comprese strade del centro storico; fonte Tratti stradali, CC BY 4.0.
- Distinto lo stato «calendario non disponibile» da «nessun lavaggio nell'intervallo», senza dedurre calendari o possibilità di parcheggio dalle geometrie aggiuntive.
- Conservati integralmente i 1.537 nomi, i 5.576 tratti e tutti i turni distinti del dataset originale di pulizia, verificando GeoJSON, SHP e dati pubblicati.
- Ricerca dei nomi migliorata per preposizioni e apostrofi, compresa la ricerca `piazza Duomo`.
- Provenienza della nuova fonte e conteggi della copertura integrata documentati in `metadata.json` e `DATA_LICENSE.md`.

### Ristrutturazione del sito

- Unica sorgente pubblicata in `docs/`, con HTML semantico e file CSS, JavaScript e dati separati.
- Moduli distinti per avvio, calendario, dati, mappa, interfaccia, formattazione e preferenze locali.
- Archivi JSON/GeoJSON locali per tratti, quartieri, Arno, etichette e metadati; fonti e licenze invariate.
- Rimosso il frammento duplicato in `src/` e il contenitore di esportazione Codex, con le dipendenze Floating UI e Lucide; D3 resta l'unica libreria esterna.
- Preferenze in `localStorage`, con lettura del formato precedente.
- Controllo della struttura del sito, test automatici con Node.js e comandi di sviluppo senza compilazione o dipendenze npm.

### Documentazione del repository

- Licenza MIT per il codice originale e descrizione distinta delle licenze dei dati.
- Attribuzioni delle fonti e avvisi sulle librerie esterne.
- Guide per contribuire, ricevere supporto e segnalare problemi di sicurezza.
- Elenco dei contributori, codice di condotta e modelli GitHub per issue e pull request.

### Prima pubblicazione

- Mappa interattiva su GitHub Pages con 5.576 tratti stradali di Firenze.
- Ricerca per strada e confronto dei lavaggi con il periodo di sosta.
- Dettaglio per tratto e segnalazione dei calendari ambigui.
- Base cartografica con quartieri e Arno; preferenze salvate nel browser.
