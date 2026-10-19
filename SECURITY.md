# Sicurezza

## Ambito

Viene mantenuta la versione corrente del ramo `main`, pubblicata su GitHub Pages. Non sono previste correzioni per copie precedenti del sito.

Il progetto è statico: non ha account, backend o chiavi API. I moduli JavaScript e i dati JSON/GeoJSON sono serviti dalla cartella `docs/` dello stesso sito; D3 7.9.0 viene caricato dal CDN jsDelivr. Non vengono interrogate automaticamente le fonti dei calendari.

Le preferenze di consultazione sono conservate in `localStorage`, con lettura del formato precedente per mantenere le scelte già salvate. Sono pertinenti, per esempio, esecuzione di script tramite dati non attendibili, esposizione delle preferenze locali o alterazione delle dipendenze.

## Segnalazione riservata

Non pubblicare credenziali, dati personali, dettagli di sfruttamento o prove contenenti informazioni sensibili nelle issue.

Controlla la [pagina Security del repository](https://github.com/GiorgioOppo/firenze-pulizia-strade/security). Se è disponibile **Report a vulnerability**, usa il modulo privato. In alternativa apri una [issue](https://github.com/GiorgioOppo/firenze-pulizia-strade/issues/new) con il solo titolo «Richiesta di un contatto riservato per la sicurezza», senza descrivere la vulnerabilità: il maintainer indicherà un canale per i dettagli. Non è indicato un indirizzo email dedicato.

Nel canale riservato includi versione o commit, browser, passaggi minimi, impatto e una prova priva di dati di altre persone. Esegui le verifiche su una copia locale e senza interagire con sistemi o utenti terzi.

Non sono promessi tempi di risposta o ricompense. Coordina l'eventuale pubblicazione dei dettagli con il maintainer.

## Errori nei calendari

Un calendario errato o non aggiornato non è, di per sé, una vulnerabilità informatica. Usa il modello di issue **Correzione dei dati** e allega una fonte pubblica; per la sosta fanno fede i cartelli sul posto.
