# Image Resizer BD

Offline, bilingual (EN / Bangla) image resizer and compressor that runs 100% in your browser. Resize, convert, rotate, flip and download your images -- nothing is ever uploaded.

## What it does

- **Upload** -- file picker or drag-and-drop. JPG, PNG, WebP, GIF. Files over 10 MB are rejected with a clear message.
- **Resize** -- exact width/height with aspect-ratio lock, fit-inside a max side, or a 10-200% scale slider.
- **Convert** -- keep the original format, or convert to PNG / JPEG / WebP. Quality slider for JPEG and WebP (10-100).
- **Transform** -- rotate 90deg left/right, flip horizontal/vertical.
- **Download** -- live output preview, real encoded output size, and a one-click download (`<name>-resized.<ext>`).
- **Privacy** -- all processing uses canvas + FileReader in your browser. No uploads, no accounts, no tracking. Your file never leaves your device.
- **Bilingual** -- EN/Bangla toggle, persisted, with Bengali digits.

## How to use

1. Open `index.html` in any modern browser (or the live GitHub Pages site).
2. Drop an image or choose a file.
3. Adjust size, format, quality, rotation/flip.
4. Click **Resize image**, preview the result, then **Download**.

## Notes and limitations

- GIF: only the first frame is processed (animated GIFs become a still image). If you keep the original format for a GIF, the output is PNG.
- Output size is the real encoded blob size shown after processing.
- Large images (near 10 MB) are processed in-memory; very old devices may be slow.
- This tool does not store your images anywhere. There is no server.

## Stack

Vanilla HTML/CSS/JavaScript. No dependencies, no build step, zero network requests.

## Testing

```bash
node tests/unit.test.js        # pure logic tests (dimension math, formats, validation)
node tests/smoke.mjs           # headless-Chrome browser smoke tests (desktop)
node tests/smoke.mjs --mobile  # headless-Chrome browser smoke tests (390px mobile)
```

See `TEST_RESULTS.md` for the recorded results.

## Status

Complete and tested. See `TEST_RESULTS.md`.
