# Passport reader

A small website that reads a photo of a passport data page in the browser and lays the details out on a summary card.

- Reads the two machine-readable lines (the MRZ) with OCR and validates all five check digits.
- Finds the portrait and crops it; you can drag and resize the frame.
- Every detail is editable, and the card redraws as you type.
- Downloads the card as a PNG and the details as JSON.

Nothing is uploaded. OCR, face detection and rendering all run in the browser tab, and every library, model and font is served from this repository.

## The card is a specimen

The card carries a SPECIMEN stamp and a "Not a travel document" strip that are drawn into the image itself. It is a summary of what was read, not a visa, travel authorisation or any other official document. There is no issuer reference, and the QR code contains only the same details as plain text.

The sample in `sample/` is a made-up passport for the fictional state of Utopia (ICAO's specimen code, UTO). Do not commit photos of real passports to this repository.

## Run it

It is a static site with no build step. Serve the folder with any web server:

```
npm start
```

Then open http://localhost:8080 and choose an image, or press "Try the specimen passport".

## Deploy to Railway

1. Push this project to GitHub.
2. Create a new Railway project and deploy the repo.
3. Railway will run `npm start` automatically.
4. The app listens on the `PORT` environment variable provided by Railway.

This project does not need a build step; the Node server in `server.js` serves the static files in the browser.

## How it works

| File | Job |
| --- | --- |
| `js/ocr.js` | Flattens the lighting of the page, then runs Tesseract.js with a model trained on OCR-B. A reading is accepted once two passes agree on it. |
| `js/mrz.js` | Finds the two lines in the OCR text, repairs common misreads, parses the TD3 layout and checks the ICAO 9303 check digits. |
| `js/face.js` | Finds the portrait with pico.js; falls back to the usual portrait position. |
| `js/card.js` | Draws the summary card on a canvas. |
| `js/app.js` | Wires the page together. |

## Limits

- Passport booklets only (TD3, two lines of 44 characters). ID cards and visas are not handled.
- The photo needs to be upright and reasonably level, with both lines sharp.
- Names and the nationality code are not protected by check digits, so compare them with the document.

## Tests

```
npm test
```

`tools/make-specimen.mjs` regenerates the sample image (needs Playwright).

Third-party components are listed in `THIRD-PARTY-NOTICES.md`.
