import { parseTd3, CHECK_POSITIONS } from './mrz.js';
import { readMrz } from './ocr.js';
import { findPortrait, clampCrop, cropRect } from './face.js';
import { buildDownloadName, buildTravelAuthorizationData, drawCard, qrText, renderTravelAuthorizationTemplate } from './card.js';
import { extractFallbackFieldsFromText, readPassportText } from './ocr.js';

const $ = (id) => document.getElementById(id);
const MAX_SOURCE = 2400;
const RATIO = 9 / 7;
const CHECK_LABELS = {
  passportNumber: 'Passport number',
  dateOfBirth: 'Date of birth',
  expiryDate: 'Expiry date',
  personalNumber: 'Personal number',
  composite: 'Whole line',
};
const EMPTY_FIELDS = {
  documentType: 'P', issuingState: '', surname: '', givenNames: '', passportNumber: '',
  nationality: '', dateOfBirth: '', sex: 'X', expiryDate: '', personalNumber: '',
};

const state = {
  source: null,
  crop: null,
  mrz: null,
  checks: null,
  fields: { ...EMPTY_FIELDS },
  trip: { plannedArrival: '', purpose: '' },
  readOn: new Date(),
  job: 0,
};

const form = $('fields');
const sourceCanvas = $('sourceCanvas');
const cardCanvas = $('cardCanvas');
const downloadCardButton = $('downloadCard');
const downloadDetailsButton = $('downloadDetails');

/* ---------- Machine-readable zone strip ---------- */

function renderMrz() {
  const box = $('mrzLines');
  const list = $('checks');
  box.textContent = '';
  const lines = state.mrz
    ? [state.mrz.line1 || '<'.repeat(44), state.mrz.line2]
    : ['P' + '<'.repeat(43), '<'.repeat(44)];
  box.classList.toggle('is-empty', !state.mrz);

  lines.forEach((line, index) => {
    const row = document.createElement('div');
    [...line].forEach((ch, pos) => {
      const span = document.createElement('span');
      span.textContent = ch;
      if (ch === '<') span.className = 'filler';
      const check = index === 1 && state.checks ? CHECK_POSITIONS[pos] : null;
      if (check) span.className = `check ${state.checks[check] ? 'pass' : 'fail'}`;
      row.append(span);
    });
    box.append(row);
  });
  box.setAttribute('aria-label', state.mrz ? lines.join(' ') : 'Nothing read yet');

  list.hidden = !state.checks;
  list.textContent = '';
  if (state.checks) {
    for (const [key, label] of Object.entries(CHECK_LABELS)) {
      const item = document.createElement('li');
      item.className = state.checks[key] ? 'pass' : 'fail';
      item.textContent = `${label}: ${state.checks[key] ? 'check digit matches' : 'check digit does not match'}`;
      list.append(item);
    }
  }
}

/* ---------- Source image and photo frame ---------- */

function renderSource() {
  const { source, crop } = state;
  if (!source) return;
  const scale = Math.min(1, 1100 / source.width);
  sourceCanvas.width = Math.round(source.width * scale);
  sourceCanvas.height = Math.round(source.height * scale);
  const ctx = sourceCanvas.getContext('2d');
  ctx.drawImage(source, 0, 0, sourceCanvas.width, sourceCanvas.height);
  if (!crop) return;
  const r = cropRect(crop);
  const [x, y, w, h] = [r.x * scale, r.y * scale, r.w * scale, r.h * scale];
  ctx.fillStyle = 'rgba(20, 35, 31, 0.3)';
  ctx.beginPath();
  ctx.rect(0, 0, sourceCanvas.width, sourceCanvas.height);
  ctx.rect(x, y, w, h);
  ctx.fill('evenodd');
  ctx.strokeStyle = '#B8922E';
  ctx.lineWidth = Math.max(2, sourceCanvas.width / 300);
  ctx.strokeRect(x, y, w, h);
}

function setCrop(crop) {
  state.crop = clampCrop(crop, state.source);
  const maxW = Math.min(state.source.width, state.source.height / RATIO);
  $('cropSize').value = Math.round((state.crop.w / maxW) * 100);
  renderSource();
  renderCard();
}

function pointerToSource(event) {
  const box = sourceCanvas.getBoundingClientRect();
  return {
    x: ((event.clientX - box.left) / box.width) * state.source.width,
    y: ((event.clientY - box.top) / box.height) * state.source.height,
  };
}

let drag = null;
sourceCanvas.addEventListener('pointerdown', (event) => {
  if (!state.crop) return;
  const p = pointerToSource(event);
  const r = cropRect(state.crop);
  const inside = p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  drag = inside ? { dx: state.crop.cx - p.x, dy: state.crop.cy - p.y } : { dx: 0, dy: 0 };
  sourceCanvas.setPointerCapture(event.pointerId);
  sourceCanvas.classList.add('is-dragging');
  setCrop({ ...state.crop, cx: p.x + drag.dx, cy: p.y + drag.dy });
});
sourceCanvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const p = pointerToSource(event);
  setCrop({ ...state.crop, cx: p.x + drag.dx, cy: p.y + drag.dy });
});
const endDrag = () => {
  drag = null;
  sourceCanvas.classList.remove('is-dragging');
};
sourceCanvas.addEventListener('pointerup', endDrag);
sourceCanvas.addEventListener('pointercancel', endDrag);
sourceCanvas.tabIndex = 0;
sourceCanvas.addEventListener('keydown', (event) => {
  const step = state.source ? state.source.width / 100 : 0;
  const move = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];
  if (!move || !state.crop) return;
  event.preventDefault();
  setCrop({ ...state.crop, cx: state.crop.cx + move[0], cy: state.crop.cy + move[1] });
});
$('cropSize').addEventListener('input', (event) => {
  if (!state.crop) return;
  const maxW = Math.min(state.source.width, state.source.height / RATIO);
  setCrop({ ...state.crop, w: (Number(event.target.value) / 100) * maxW });
});

/* ---------- Card and details ---------- */

function renderCard() {
  drawCard(cardCanvas, {
    fields: state.fields,
    trip: state.trip,
    source: state.source,
    crop: state.crop,
    checksPassed: state.checks ? Object.values(state.checks).filter(Boolean).length : null,
    readOn: state.readOn,
  });
}

function fillForm() {
  for (const element of form.elements) {
    if (!element.name) continue;
    element.value = element.name in state.trip ? state.trip[element.name] : state.fields[element.name] || '';
    const failed = state.checks && element.name in state.checks && !state.checks[element.name];
    element.classList.toggle('is-unchecked', Boolean(failed));
  }
}

form.addEventListener('input', (event) => {
  const { name } = event.target;
  if (!name) return;
  let value = event.target.value.trim();
  if (['passportNumber', 'nationality', 'issuingState', 'surname', 'givenNames'].includes(name)) {
    value = value.toUpperCase();
  }
  if (name in state.trip) state.trip[name] = value;
  else state.fields[name] = value;
  event.target.classList.remove('is-unchecked');
  renderCard();
});
form.addEventListener('submit', (event) => event.preventDefault());

function setStatus(text, { problem = false, progress = null } = {}) {
  $('statusText').textContent = text;
  $('status').classList.toggle('is-problem', problem);
  const bar = $('progress');
  bar.hidden = progress === null;
  if (progress !== null) bar.value = progress;
}

function downloadPdfFromCard() {
  const canvas = cardCanvas;
  if (!canvas) return;

  if (!window.jspdf?.jsPDF) {
    const link = document.createElement('a');
    link.download = buildDownloadName(state.fields);
    link.href = canvas.toDataURL('image/png');
    link.click();
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const payload = buildTravelAuthorizationData(state.fields, {
      plannedArrival: state.trip.plannedArrival || '2026-10-26',
      purpose: state.trip.purpose || 'HOLIDAY',
      reference: '48YR8RDE',
    });
    renderTravelAuthorizationTemplate(pdf, payload, state.source, state.crop);
    pdf.save(buildDownloadName(state.fields));
  } catch (error) {
    console.error('PDF export failed', error);
    const link = document.createElement('a');
    link.download = buildDownloadName(state.fields);
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}

function downloadDetailsJson() {
  const payload = {
    readOn: state.readOn.toISOString(),
    fields: state.fields,
    trip: state.trip,
    checks: state.checks,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = buildDownloadName(state.fields, 'passport-details.json').replace(/\.pdf$/, '.json');
  link.click();
  URL.revokeObjectURL(url);
}

/* ---------- Reading an image ---------- */

async function toCanvas(blob) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('That file could not be opened as an image. Use a JPEG, PNG or WebP.');
  }
  const scale = Math.min(1, MAX_SOURCE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}

async function readImage(blob) {
  const job = ++state.job;
  $('intakeError').hidden = true;
  let source;
  try {
    source = await toCanvas(blob);
  } catch (error) {
    $('intakeError').textContent = error.message;
    $('intakeError').hidden = false;
    return;
  }

  Object.assign(state, {
    source, crop: null, mrz: null, checks: null,
    fields: { ...EMPTY_FIELDS }, trip: { plannedArrival: '', purpose: '' }, readOn: new Date(),
  });
  $('intake').hidden = true;
  $('workbench').hidden = false;
  renderMrz();
  renderSource();
  fillForm();
  renderCard();
  setStatus('Reading the machine-readable zone', { progress: 0 });

  const portrait = findPortrait(source).then((result) => {
    if (job === state.job) setCrop(result.crop);
    return result;
  });

  let found = null;
  let failure = '';
  try {
    found = await readMrz(source, (p) => {
      if (job === state.job) setStatus('Reading the machine-readable zone', { progress: p });
    });
  } catch (error) {
    console.error(error);
    failure = 'The text reader did not start. Reload the page and try again, or type the details below.';
  }
  const { detected } = await portrait;
  if (job !== state.job) return;

  const frameNote = detected ? '' : ' The photo frame is a guess; drag it onto the portrait.';
  if (!found) {
    let fallbackText = '';
    try {
      fallbackText = await readPassportText(source, (p) => {
        if (job === state.job) setStatus('Reading passport text fallback', { progress: p });
      });
    } catch {
      fallbackText = '';
    }

    const fallbackFields = extractFallbackFieldsFromText(fallbackText);
    if (fallbackFields) {
      state.fields = fallbackFields;
      state.mrz = null;
      state.checks = null;
      renderMrz();
      fillForm();
      renderCard();
      setStatus('Recovered the passport details from the OCR fallback.', { progress: 1 });
      return;
    }

    setStatus(
      (failure ||
        'No machine-readable zone found. Use a sharper, level photo that includes the two lines of chevrons, or type the details below.') +
        frameNote,
      { problem: true }
    );
    return;
  }

  const parsed = parseTd3(found.line1, found.line2);
  state.mrz = { line1: parsed.line1, line2: parsed.line2 };
  state.checks = parsed.checks;
  state.fields = parsed.fields;
  renderMrz();
  fillForm();
  renderCard();

  const failed = Object.values(parsed.checks).filter((ok) => !ok).length;
  if (failed === 0) {
    setStatus(`Read the passport. All five check digits match.${frameNote}`);
  } else {
    setStatus(
      `Read the passport, but ${failed} of 5 check digits do not match. Compare the marked details with the document.${frameNote}`,
      { problem: true }
    );
  }
}

/* ---------- Intake ---------- */

const dropzone = $('dropzone');
$('chooseFile').addEventListener('click', () => $('fileInput').click());
$('fileInput').addEventListener('change', (event) => {
  const [file] = event.target.files;
  if (file) readImage(file);
  event.target.value = '';
});
$('trySpecimen').addEventListener('click', async () => {
  const response = await fetch('sample/specimen-passport.png');
  readImage(await response.blob());
});
downloadCardButton.addEventListener('click', downloadPdfFromCard);
downloadDetailsButton.addEventListener('click', downloadDetailsJson);
for (const type of ['dragenter', 'dragover']) {
  window.addEventListener(type, (event) => {
    event.preventDefault();
    dropzone.classList.add('is-over');
  });
}
window.addEventListener('dragleave', (event) => {
  if (!event.relatedTarget) dropzone.classList.remove('is-over');
});
window.addEventListener('drop', (event) => {
  event.preventDefault();
  dropzone.classList.remove('is-over');
  const [file] = event.dataTransfer.files;
  if (file) readImage(file);
});
window.addEventListener('paste', (event) => {
  const file = [...event.clipboardData.files].find((f) => f.type.startsWith('image/'));
  if (file) readImage(file);
});
$('another').addEventListener('click', () => {
  state.job++;
  Object.assign(state, { source: null, crop: null, mrz: null, checks: null, fields: { ...EMPTY_FIELDS } });
  $('workbench').hidden = true;
  $('intake').hidden = false;
  renderMrz();
});

/* ---------- Downloads ---------- */

function save(blob, name) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

const fileStem = () => `passport-summary-${(state.fields.passportNumber || 'card').toLowerCase()}`;

$('downloadCard').addEventListener('click', () => {
  cardCanvas.toBlob((blob) => save(blob, `${fileStem()}-specimen.png`), 'image/png');
});
$('downloadDetails').addEventListener('click', () => {
  const details = {
    notice: 'Specimen summary. Not a travel document; details are unverified.',
    readOn: state.readOn.toISOString(),
    fields: state.fields,
    trip: state.trip,
    machineReadableZone: state.mrz,
    checkDigits: state.checks,
    qrText: qrText(state.fields, state.trip),
  };
  save(new Blob([JSON.stringify(details, null, 2)], { type: 'application/json' }), `${fileStem()}.json`);
});

/* ---------- Start ---------- */

renderMrz();
Promise.all([
  document.fonts.load('700 40px B612'),
  document.fonts.load('400 40px B612'),
  document.fonts.load('700 40px "B612 Mono"'),
]).then(() => {
  if (state.source) renderCard();
});

// Small hook for automated tests.
window.passportReader = { state, readImage };
