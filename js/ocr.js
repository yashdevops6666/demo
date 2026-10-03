// OCR of the machine-readable zone with Tesseract.js, entirely in the browser.
// Uses a model trained on the OCR-B typeface that passports print the zone in.
/* global Tesseract */
import { findMrz, FULL_SCORE, parseTd3 } from './mrz.js';

const base = (path) => new URL(path, document.baseURI).href;
const BLOCK = 24;

let workerPromise = null;
let progressListener = () => {};

function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await Tesseract.createWorker('mrz', 1, {
        workerPath: base('vendor/tesseract/worker.min.js'),
        corePath: base('vendor/tesseract'),
        langPath: base('vendor/tesseract'),
        gzip: true,
        logger: (m) => {
          if (m.status === 'recognizing text') progressListener(m.progress);
        },
      });
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
        tessedit_pageseg_mode: '6',
      });
      return worker;
    })();
    workerPromise.catch(() => (workerPromise = null));
  }
  return workerPromise;
}

/**
 * Cut a horizontal band out of the source, scale it for OCR and flatten the lighting:
 * each pixel is divided by the paper brightness around it, which removes shadows,
 * glare gradients and most of the background print.
 */
function prepareBand(source, top, bottom, ocrWidth) {
  const sy = Math.round(source.height * top);
  const sh = Math.round(source.height * (bottom - top));
  const scale = ocrWidth / source.width;
  const canvas = document.createElement('canvas');
  canvas.width = ocrWidth;
  canvas.height = Math.max(BLOCK, Math.round(sh * scale));
  const { width, height } = canvas;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, sy, source.width, sh, 0, 0, width, height);

  const image = ctx.getImageData(0, 0, width, height);
  const px = image.data;
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < gray.length; i++) gray[i] = (px[i * 4] * 77 + px[i * 4 + 1] * 150 + px[i * 4 + 2] * 29) >> 8;

  // Paper brightness per block (85th percentile), smoothed by letting the canvas upscale it.
  const bw = Math.ceil(width / BLOCK);
  const bh = Math.ceil(height / BLOCK);
  const small = document.createElement('canvas');
  small.width = bw;
  small.height = bh;
  const smallCtx = small.getContext('2d');
  const blocks = smallCtx.createImageData(bw, bh);
  const histogram = new Uint16Array(256);
  for (let by = 0; by < bh; by++) {
    for (let bx = 0; bx < bw; bx++) {
      histogram.fill(0);
      let count = 0;
      for (let y = by * BLOCK; y < Math.min(height, (by + 1) * BLOCK); y += 2) {
        for (let x = bx * BLOCK; x < Math.min(width, (bx + 1) * BLOCK); x += 2) {
          histogram[gray[y * width + x]]++;
          count++;
        }
      }
      let level = 255;
      for (let above = 0; level > 0 && (above += histogram[level]) < count * 0.15; level--);
      const o = (by * bw + bx) * 4;
      blocks.data[o] = blocks.data[o + 1] = blocks.data[o + 2] = level;
      blocks.data[o + 3] = 255;
    }
  }
  smallCtx.putImageData(blocks, 0, 0);
  const paper = document.createElement('canvas');
  paper.width = width;
  paper.height = height;
  const paperCtx = paper.getContext('2d', { willReadFrequently: true });
  paperCtx.imageSmoothingQuality = 'high';
  paperCtx.drawImage(small, 0, 0, bw, bh, 0, 0, bw * BLOCK, bh * BLOCK);
  const bg = paperCtx.getImageData(0, 0, width, height).data;

  for (let i = 0; i < gray.length; i++) {
    const v = Math.min(255, (gray[i] / Math.max(40, bg[i * 4])) * 255);
    px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = v > 235 ? 255 : v;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

/**
 * Look for the MRZ in the image. Each pass reads a band of the page at one text size.
 * Names are not covered by check digits, so a reading is only accepted once two passes
 * agree on it character for character; otherwise the best-scoring reading wins.
 * Returns { line1, line2, score } or null.
 */
export async function readPassportText(source, onProgress = () => {}) {
  const worker = await getWorker();
  progressListener = (p) => onProgress(p);
  const { data } = await worker.recognize(source);
  onProgress(1);
  return data.text;
}

export function extractFallbackFieldsFromText(rawText) {
  if (!rawText) return null;
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ''))
    .filter((line) => line.length >= 20 && /[A-Z0-9<]/.test(line));

  const candidates = [];
  for (let i = 0; i < lines.length; i++) {
    const line1 = lines[i];
    if (!/^P[<A-Z0-9]{20,}$/.test(line1)) continue;
    for (let j = i + 1; j < lines.length; j++) {
      const line2 = lines[j];
      if (!/^[A-Z0-9<]{20,}$/.test(line2)) continue;
      const parsed = parseTd3(line1.slice(0, 44).padEnd(44, '<'), line2.slice(0, 44).padEnd(44, '<'));
      const filled = [parsed.fields.surname, parsed.fields.givenNames, parsed.fields.passportNumber]
        .filter(Boolean).join(' ');
      if (filled) candidates.push(parsed.fields);
    }
  }

  return candidates[0] || null;
}

export async function readMrz(source, onProgress = () => {}) {
  const worker = await getWorker();
  // [top, bottom, width the band is scaled to]
  const passes = [
    [0.6, 1, 1800],
    [0.6, 1, 1350],
    [0.4, 1, 1600],
    [0, 1, 1800],
    [0, 1, 1350],
    [0.25, 0.8, 1800],
  ];
  const seen = new Map();
  let best = null;
  for (let i = 0; i < passes.length; i++) {
    progressListener = (p) => onProgress((i + p) / passes.length);
    const { data } = await worker.recognize(prepareBand(source, ...passes[i]));
    const found = findMrz(data.text);
    if (!found) continue;
    const key = `${found.line1}\n${found.line2}`;
    const votes = (seen.get(key) || 0) + 1;
    seen.set(key, votes);
    const rank = found.score + votes * 0.1;
    if (!best || rank > best.rank) best = { ...found, rank };
    if (found.score >= FULL_SCORE && votes >= 2) break;
  }
  onProgress(1);
  return best;
}
