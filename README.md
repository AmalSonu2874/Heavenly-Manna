# Heavenly Manna

A single-file-structure, GitHub Pages-ready Progressive Web App for the supplied Heavenly Manna daily reading and Morning Vow.

## Files

- `index.html` — main application page
- `MANNA.css` — all visual styling, typography, responsive UI, watermark and animations
- `MANNA.js` — application logic, calendar, navigation, reading transitions, interactions, Vow popup and Sathyavedapusthakam verse reader
- `MANNA-DATA.js` — complete 366-day Heavenly Manna dataset
- `VOW-DATA.js` — supplied Morning Vow content
- `MANNA-logo.svg` — common master logo used throughout the app and watermark
- `HEAVENLY-MANNA.pdf` — original Heavenly Manna source PDF
- `MORNING-VOW.pdf` — original Morning Vow source PDF
- `FAVICON*` / `APPLE-TOUCH-ICON.png` — application icons
- `FONT-*` — bundled Inter and Malayalam fonts
- `manifest.webmanifest` — PWA configuration
- `service-worker.js` — offline cache and PWA asset handling

## GitHub Pages

Upload **all files in this directory directly into the repository root**. There are intentionally no subfolders.

The site entry point is `index.html`, so GitHub Pages can serve it directly without changing paths.

## Local testing

Use a local HTTP server rather than opening `index.html` with `file://`, because service workers require HTTP/HTTPS.

Example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/`.

## Content

The Heavenly Manna dataset is kept in `MANNA-DATA.js` as the content source. The application reads the entry for the selected calendar date and does not fabricate missing daily content.

## Parallel verse reader

The clickable `സമാന്തരവേദഭാഗങ്ങൾ` references open the corresponding Malayalam text from **Sathyavedapusthakam 1910 (`mal1910`) only**. The reader preserves the reference order and supports individual verses, ranges, and chapter references. Verse lookups use the public GetBible Query/Main API and can be cached by the PWA service worker after they are first loaded.
