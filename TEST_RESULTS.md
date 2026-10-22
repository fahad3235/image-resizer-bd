# TEST_RESULTS -- image-resizer-bd

## Unit tests (node, pure logic)

Command: `node tests/unit.test.js`
Result: **40/40 checks pass**

Coverage: aspect-lock math (incl. 800x600 -> width 400 = 400x300), fit-inside (incl. no-upscale rule), percent resize (incl. 800x600 @50% = 400x300), rotate dimension swap, MIME resolution (incl. GIF -> PNG), file validation (type, empty, 10 MB boundary -- exactly 10 MB allowed, 11 MB rejected), byte formatting, output naming, clampInt.

## Browser smoke tests (headless Chrome, file:// + raw CDP)

Commands: `node tests/smoke.mjs` and `node tests/smoke.mjs --mobile`
Result: **27/27 desktop + 28/28 mobile pass, 0 console/page errors**

Coverage: static UI + privacy banner, EN->BN->EN toggle, upload of a programmatically generated 800x600 PNG, original dims display, aspect-lock 400->300, process -> output 400x300 + blob-URL download link with `-resized.png` name, percent slider 50% -> 400x300, rotate-right -> 300x400, reset -> empty state, fit-inside max 200 -> 200x150, WebP conversion + `.webp` download name, invalid text file -> visible error, 390px no horizontal overflow (mobile).

## Hand-verified

- 800x600 -> 50% = 400x300 (unit + browser).
- Aspect lock holds ratio on width and height edits.
- Fit-inside never upscales a smaller image.

## Repairs (2)

1. **App bug** -- `fitInside` clamped a 0 max-side up to 1 instead of rejecting it. Fixed validation to return null for max-side < 1. Test re-run green.
2. **Test-side fixes** -- smoke harness connected to the browser CDP endpoint (`/json/version`), which has no Page domain; switched to `/json/list` page target (same pattern as sibling builds). Also wrapped bare `const` declarations in IIFEs because CDP evaluates share one page scope. No app code changed for these.

## Limitations

- GIF: only the first frame is processed (animated GIFs become still images); GIF "keep original" re-encodes as PNG.
- Processing is in-memory; very large images near the 10 MB limit may be slow on old devices.
- No server component; output quality depends on the browser's canvas encoders.
