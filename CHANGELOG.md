# Registro delle modifiche

## 2026-10-19

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
