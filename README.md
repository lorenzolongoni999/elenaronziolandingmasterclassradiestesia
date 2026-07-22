# Landing Masterclass gratuita di Radiestesia e Radionica

Landing page statica in HTML, CSS e JavaScript vanilla. Non richiede build, framework o dipendenze.

## Avvio locale

È possibile aprire direttamente `index.html` in un browser moderno. Per un test più fedele a un hosting tradizionale, dalla cartella del progetto eseguire:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

La pagina sarà disponibile su:

```text
http://127.0.0.1:4173/
```

## Struttura

```text
landing-radiestesia/
├── index.html
├── privacy-policy.html
├── cookie-policy.html
├── termini-condizioni.html
├── css/
│   ├── style.css
│   └── legal.css
├── js/
│   └── script.js
└── assets/
    ├── fonts/
    │   └── README.md
    └── images/
        ├── elena-ronzio.jpg
        ├── logo-elena-ronzio.png
        ├── pendolo-community.jpg
        └── pendolo-masterclass.jpg
```

## Configurazioni prima della pubblicazione

1. Collegare il form al CRM, webhook o backend nel punto `TODO` presente in `js/script.js`.
2. Far verificare da un professionista i testi legali prima della messa online. Privacy Policy e Termini riportano integralmente i testi forniti; la Cookie Policy descrive la configurazione statica attuale e dovrà essere aggiornata in base a hosting, CRM, analytics o servizi esterni effettivamente attivati.
3. Attivare canonical, `og:url` e `og:image` dopo aver definito il dominio pubblico.
4. Se disponibile, sostituire le CTA interne con la URL diretta di iscrizione alla Masterclass. In assenza della URL, tutte le CTA portano al form finale.
5. Aggiungere i font originali elencati in `assets/fonts/README.md` e attivare i blocchi `@font-face` all’inizio di `css/style.css`.

## Form

Il form include un identificativo nascosto della Masterclass, validazione front-end, messaggi accessibili, honeypot, privacy obbligatoria, stato di invio e conferma simulata. Non trasmette dati a servizi esterni finché non viene configurato un endpoint.

## Immagini e animazioni

La pagina usa il logo, la foto di Elena e le fotografie del pendolo ricevute. Le immagini sono state ridimensionate e compresse come JPEG progressivi per il web. La sezione di Antonina è stata progettata come layout editoriale senza fotografia.

Titoli, card, statistiche e fotografie si compongono progressivamente durante lo scroll. Le animazioni rispettano `prefers-reduced-motion` e i contenuti restano visibili anche se JavaScript non è disponibile. Le prove sociali sono generali e la pagina specifica che la Masterclass gratuita non rilascia un attestato.

## Documenti legali

I link nel footer aprono Privacy Policy, Cookie Policy e Termini e condizioni in un dialog accessibile. Le stesse pagine restano raggiungibili direttamente e funzionano anche senza JavaScript.
