# Componenti di terze parti

La [licenza MIT del progetto](LICENSE) copre il codice e la documentazione originali. I dati sono descritti separatamente in [DATA_LICENSE.md](DATA_LICENSE.md). Le librerie mantengono le licenze dei rispettivi autori.

| Componente | Versione caricata | Utilizzo | Licenza e fonte |
| --- | --- | --- | --- |
| D3 | 7.9.0 | Proiezione geografica, geometrie, zoom e selezioni | [ISC — Mike Bostock](https://github.com/d3/d3/blob/v7.9.0/LICENSE) |
| Floating UI core | 1.7.3 | Supporto ai tooltip del contenitore esportato | [MIT — Floating UI contributors](https://github.com/floating-ui/floating-ui/blob/master/LICENSE) |
| Floating UI DOM | 1.7.4 | Supporto ai tooltip del contenitore esportato | [MIT — Floating UI contributors](https://github.com/floating-ui/floating-ui/blob/master/LICENSE) |
| Lucide | 1.17.0 | Supporto alle icone del contenitore esportato | [ISC — Lucide Icons and Contributors; alcune icone derivate da Feather sono MIT — Cole Bemis](https://github.com/lucide-icons/lucide/blob/main/LICENSE) |

D3 viene caricato da jsDelivr. Floating UI e Lucide vengono caricati da unpkg dal contenitore HTML esportato, anche se la mappa attuale non utilizza icone o tooltip di queste librerie. Non sono presenti installazioni npm o copie vendorizzate di queste librerie nel repository.

La pagina completa comprende inoltre il contenitore statico generato con lo strumento di esportazione Visualize di Codex: CSS di base, gestione del tema, dimensionamento del riquadro e memorizzazione locale delle scelte. Le interazioni non richiedono l'accesso a un account Codex o OpenAI. Questa indicazione descrive la provenienza dell'esportazione e non attribuisce una licenza diversa ai dati o alle librerie elencate.

Chi redistribuisce o incorpora una libreria deve conservare i relativi avvisi di copyright e licenza. I collegamenti sopra riportati rimandano ai testi pubblicati dai progetti originali.
