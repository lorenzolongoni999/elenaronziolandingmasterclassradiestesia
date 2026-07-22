# Font locali

Per attivare la tipografia originale del design system, inserire in questa cartella i file autorizzati con questi nomi:

- `Perandory-Condensed.woff2`
- `OldNewspaperTypes-Regular.woff2`
- `PublicSans-Regular.woff2`
- `PublicSans-SemiBold.woff2`
- `PublicSans-Bold.woff2`

Quindi rimuovere il commento dai blocchi `@font-face` all’inizio di `css/style.css`.

Finché i file non sono disponibili, la pagina usa fallback locali coerenti e non genera richieste 404.
