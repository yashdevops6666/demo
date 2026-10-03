// Finds the portrait on the data page with pico.js (a small cascade face detector).
/* global pico */

const RATIO = 9 / 7; // passport photo proportions, height / width
const DETECT_SIZE = 720;

let cascade = null;

async function loadCascade() {
  if (!cascade) {
    const response = await fetch(new URL('vendor/facefinder.bin', document.baseURI));
    if (!response.ok) throw new Error('Face model did not load');
    cascade = pico.unpack_cascade(new Int8Array(await response.arrayBuffer()));
  }
  return cascade;
}

/** Portrait position on a typical data page, used when no face is detected. */
export function fallbackCrop(source) {
  const w = source.width * 0.27;
  return clampCrop({ cx: source.width * 0.185, cy: source.height * 0.44, w }, source);
}

export function clampCrop(crop, source) {
  const w = Math.max(40, Math.min(crop.w, source.width, source.height / RATIO));
  const h = w * RATIO;
  return {
    w,
    cx: Math.max(w / 2, Math.min(source.width - w / 2, crop.cx)),
    cy: Math.max(h / 2, Math.min(source.height - h / 2, crop.cy)),
  };
}

export const cropRect = (crop) => ({
  x: crop.cx - crop.w / 2,
  y: crop.cy - (crop.w * RATIO) / 2,
  w: crop.w,
  h: crop.w * RATIO,
});

/** Returns { crop, detected }. The crop is { cx, cy, w } in source pixels. */
export async function findPortrait(source) {
  try {
    const classify = await loadCascade();
    const scale = Math.min(1, DETECT_SIZE / Math.max(source.width, source.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(source.width * scale);
    canvas.height = Math.round(source.height * scale);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const gray = new Uint8Array(canvas.width * canvas.height);
    for (let i = 0; i < gray.length; i++) {
      gray[i] = (rgba[i * 4] * 77 + rgba[i * 4 + 1] * 150 + rgba[i * 4 + 2] * 29) >> 8;
    }
    const shorter = Math.min(canvas.width, canvas.height);
    let detections = pico.run_cascade(
      { pixels: gray, nrows: canvas.height, ncols: canvas.width, ldim: canvas.width },
      classify,
      { shiftfactor: 0.1, minsize: Math.round(shorter * 0.1), maxsize: shorter, scalefactor: 1.1 }
    );
    detections = pico.cluster_detections(detections, 0.2).filter((d) => d[3] > 30);
    if (!detections.length) return { crop: fallbackCrop(source), detected: false };

    // The printed portrait is the strongest detection; a ghost image scores lower.
    const [row, col, size] = detections.sort((a, b) => b[3] - a[3])[0];
    const crop = { cx: col / scale, cy: (row + size * 0.14) / scale, w: (size * 1.4) / scale };
    return { crop: clampCrop(crop, source), detected: true };
  } catch (error) {
    console.warn(error);
    return { crop: fallbackCrop(source), detected: false };
  }
}
