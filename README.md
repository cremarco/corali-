# Ristorante Coralì

Sito statico con home, menu, carta vini, galleria e informazioni sull’accessibilità. I file HTML, CSS, JavaScript e le immagini sono pronti per la pubblicazione senza compilazione sul server.

## Aggiornamenti

```sh
npm ci
npm run build
npm run check:seo
```

Dopo modifiche alle classi HTML o a `site.js`, ricompilare e pubblicare anche `assets/site.css`. Tailwind 4.3.0 è fissato nel lockfile e non viene eseguito nel browser.

Le foto originali rimangono in PNG. `assets/images.json` elenca le versioni WebP a dimensione originale e da 640 px. Per rigenerarle serve `cwebp` (su macOS: `brew install webp`):

```sh
npm run optimize:images
```

Quando si aggiorna la carta, mantenere sincronizzati il testo visibile e il relativo menu JSON-LD. Aggiornare `lastmod` in `sitemap.xml` e `dateModified` solo per modifiche significative effettive. `npm run check:seo` verifica metadati, URL canonici, collegamenti, immagini e prezzi tra pagina e dati strutturati.

Le anteprime social delle quattro pagine principali sono JPEG distinti da 1200 × 630 px in `img/social/`. Il layout sorgente è `assets/social-previews.html`: ogni articolo corrisponde a un'immagine, renderizzata nel browser a dimensione originale con qualità JPEG 86. Le fotografie e il logo provengono dagli asset del ristorante. Se si sostituiscono le immagini, aggiornare insieme `og:image`, `og:image:secure_url`, `twitter:image`, dimensioni e testo alternativo. Verificare l'anteprima in WhatsApp dopo la pubblicazione: la simulazione locale non controlla la cache del servizio.

La navigazione mobile e gli indici delle sezioni usano disclosure HTML native e funzionano anche senza JavaScript. La hero mantiene la composizione originale del marchio e delle fotografie. La sequenza di ingresso dura 7,3 secondi, con dissolvenze finali sovrapposte di circa 2 secondi e cambi di fotografia di 2,4 secondi. Non sostituire le dissolvenze con cambi di stato istantanei: il movimento della foto uscente continua fino al completamento del passaggio. La hero rispetta il movimento ridotto e può essere messa in pausa; lo slideshow si ferma fuori dal viewport o quando la scheda è nascosta.

La prima pressione di Tab mostra «Salta al contenuto». I collegamenti alle sezioni spostano anche il focus al titolo corrispondente; Escape chiude gli indici e restituisce il focus al comando. Le foto della sala hanno una pausa indipendente e si fermano fuori schermo. Senza JavaScript le animazioni della home restano statiche grazie ad `assets/no-motion.css`. Le didascalie e le griglie possono crescere con il testo ingrandito, e il focus tiene conto dell’intestazione fissa e degli indici mobile.

La pagina `accessibilita.html`, collegata dal footer di tutte le pagine, descrive le funzioni disponibili, le verifiche effettuate e i contatti del ristorante per le segnalazioni. Non dichiara una conformità WCAG completa. Aggiornare la data e le informazioni quando cambiano le funzioni o vengono svolte nuove verifiche.

Pubblicare insieme le cinque pagine, `assets/site.css`, `assets/no-motion.css`, le immagini WebP, `site.js`, `robots.txt` e `sitemap.xml`. Il dominio canonico è `https://www.coralivarazze.it/`. Dopo la pubblicazione, la sitemap può essere inviata a Google Search Console; la registrazione del dominio e i redirect del server si gestiscono sul servizio di hosting.
