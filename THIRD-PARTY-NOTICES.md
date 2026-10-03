# Third-party components

Everything under `vendor/` is redistributed under its own licence.

| Component | Files | Licence | Source |
| --- | --- | --- | --- |
| Tesseract.js 7.0.0 | `vendor/tesseract/tesseract.min.js`, `worker.min.js` | Apache-2.0 | https://github.com/naptha/tesseract.js |
| tesseract.js-core 7.0.0 | `vendor/tesseract/tesseract-core-*.wasm.js` | Apache-2.0 | https://github.com/naptha/tesseract.js-core |
| MRZ model | `vendor/tesseract/mrz.traineddata.gz` | BSD-3-Clause, © 2019 DoubangoTelecom | https://github.com/DoubangoTelecom/tesseractMRZ |
| pico.js 1.0.0 | `vendor/pico.js` | MIT | https://github.com/tehnokv/picojs |
| pico face cascade | `vendor/facefinder.bin` | MIT, © Nenad Markuš | https://github.com/nenadmarkus/pico |
| qrcode-generator 2.0.4 | `vendor/qrcode.js` | MIT, © Kazuhiko Arase | https://github.com/kazuhikoarase/qrcode-generator |
| B612 and B612 Mono | `vendor/fonts/*.woff2` | SIL Open Font License 1.1 | https://github.com/polarsys/b612 |

Changes made here: the MRZ model (`tessdata_best/mrz.traineddata`) was converted to its integer form with `combine_tessdata -c` and gzipped; `pico.js` has two small edits for direct browser use, noted at the top of the file.

The MRZ model's full licence text is in `vendor/tesseract/LICENSE-mrz-model.txt`.
