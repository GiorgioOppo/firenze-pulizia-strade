# Pulizia strade a Firenze

Mappa interattiva dei calendari di lavaggio stradale, per confrontare i turni con il periodo in cui si intende lasciare l'auto.

Il sito permette di impostare arrivo e partenza, cercare una strada e selezionare i singoli tratti. I turni pari/dispari non documentati e gli orari incongruenti vengono segnalati come da verificare, senza inventare una cadenza.

## Sito

https://giorgiooppo.github.io/firenze-pulizia-strade/

GitHub Pages pubblica la cartella `docs` del ramo `main`. Non occorrono un server applicativo, chiavi API o un processo di compilazione. `docs/index.html` contiene la pagina completa; `src/map.fragment.html` conserva la sorgente della visualizzazione.

Per provare il sito in locale:

```sh
python3 -m http.server 8000 --directory docs
```

Aprire http://localhost:8000/ nel browser.

## Dati e limiti

La copia dei dati è stata generata il **19 ottobre 2026**. Il sito non si aggiorna automaticamente. I 6.269 record originali sono raggruppati in 5.576 tratti, conservando tutti i turni distinti per ciascun tratto.

Le date e gli orari vengono interpretati come ora locale di Roma. Un lavaggio martedì dalle 00:00 alle 06:00 riguarda la notte fra lunedì e martedì.

La mappa riguarda il lavaggio stradale: non indica disponibilità degli stalli, autorizzazioni ZTL, lato strada, eccezioni festive o altri divieti. Fa fede la segnaletica sul posto. Consultare anche gli [avvisi ufficiali Plures](https://www.plures.it/it-it/cittadini/cittadini/servizi/servizi-ai-cittadini/spazzamento-strade).

Le scelte di consultazione vengono conservate nel browser. Nessun dato personale viene inviato dall'applicazione; il caricamento della pagina e delle librerie comporta le normali richieste a GitHub Pages e ai CDN indicati nella pagina.

## Fonti e licenze

- [Pulizia Strade — Comune di Firenze / dati Alia](https://opendata.comune.fi.it/page_dataset_show?id=pulizia-strade), **CC BY-NC-SA 4.0**. La rappresentazione elaborata mantiene la stessa licenza; sono stati rimossi i duplicati esatti e arrotondate le coordinate a circa un metro.
- [Aree quartieri — Comune di Firenze](https://opendata.comune.fi.it/page_dataset_show?id=5e08844a-c0d8-4d64-a3b2-d1ab58d9283f), **CC BY 4.0**.
- [Reticolo fluviale — Comune di Firenze / Autorità di Bacino del fiume Arno](https://opendata.comune.fi.it/page_dataset_show?id=84569d87-0b14-404e-adea-fd486c0a50b8), **CC BY 4.0**; selezionati i tratti denominati FIUME ARNO.

Testi delle licenze: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) e [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Progetto indipendente, non un servizio ufficiale del Comune di Firenze o di Plures.
