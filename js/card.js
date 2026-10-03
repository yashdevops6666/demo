// Draws the summary card on a canvas so the downloaded PNG is exactly what is shown,
// including the specimen stamp and the "not a travel document" strip.
/* global qrcode */
import { countryName } from './countries.js';
import { cropRect } from './face.js';

export const CARD_W = 1600;
export const CARD_H = 1000;

const C = {
  paper: '#EEF3EF',
  ink: '#14231F',
  cover: '#1F4D3F',
  stamp: '#B4232A',
  gold: '#B8922E',
  muted: '#55665F',
  line: '#C5D2CA',
};
const SANS = 'B612, "Segoe UI", system-ui, sans-serif';
const MONO = '"B612 Mono", ui-monospace, monospace';

const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
export const prettyDate = (iso) => (iso ? DATE.format(new Date(`${iso}T00:00:00Z`)) : '');

/** Plain-text contents of the QR code: the same details that are printed on the card. */
export function qrText(fields, trip) {
  const lines = [
    'SPECIMEN - NOT A TRAVEL DOCUMENT',
    `Name: ${[fields.surname, fields.givenNames].filter(Boolean).join(', ')}`,
    `Passport number: ${fields.passportNumber}`,
    `Nationality: ${fields.nationality}`,
    `Date of birth: ${fields.dateOfBirth}`,
    `Sex: ${fields.sex}`,
    `Passport expires: ${fields.expiryDate}`,
  ];
  if (trip.plannedArrival) lines.push(`Planned arrival: ${trip.plannedArrival}`);
  if (trip.purpose) lines.push(`Purpose: ${trip.purpose}`);
  return lines.join('\n');
}

export function buildDownloadName(fields, fallback = 'passport-summary') {
  const parts = [fields?.surname, fields?.givenNames, fields?.passportNumber]
    .filter(Boolean)
    .map((part) => String(part)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim())
    .filter(Boolean);

  const safe = parts.length
    ? parts.join('-').replace(/\s+/g, '-').replace(/-+/g, '-').toUpperCase()
    : fallback;

  return `${safe.replace(/[^a-zA-Z0-9-]/g, '') || fallback}.pdf`;
}

export function buildTravelAuthorizationData(fields, trip = {}) {
  const clean = (value, fallback = 'UNKNOWN') => {
    const next = String(value ?? '').replace(/[<>]/g, '').trim();
    return next || fallback;
  };

  const firstName = clean(fields?.givenNames || fields?.firstName).split(/\s+/)[0].toUpperCase();
  const lastName = clean(fields?.surname).toUpperCase();
  const passportNumber = clean(fields?.passportNumber || fields?.personalNumber).toUpperCase();
  const issuer = clean(fields?.issuingState || fields?.nationality || 'IND').toUpperCase();
  const defaultArrivalDate = '2026-10-26';
  const arrivalDate = clean(trip?.plannedArrival || defaultArrivalDate, defaultArrivalDate);
  const purpose = clean(trip?.purpose || 'HOLIDAY').toUpperCase();
  const ref = clean(trip?.reference || '48YR8RDE').toUpperCase();

  return {
    reference: ref,
    firstName,
    lastName,
    issuer,
    passportNumber,
    type: 'TA',
    entries: 'SINGLE ENTRY',
    arrivalDate,
    purpose,
    carrierOut: '6E 1855',
    carrierBack: '6E 1856',
    residence: 'Seychelles',
    residenceDateFrom: '25 Oct 2026',
    residenceDateTo: '10 Nov 2026',
    hotel: 'Berjaya Beau Vallon Bay Resort & Casino, Beau Vallon,',
    hotelCity: 'Seychelles',
  };
}

export function renderTravelAuthorizationTemplate(pdf, data, source = null, crop = null) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  const cardX = 45;
  const cardY = 30;
  const cardW = 500;
  const cardH = 760;

  pdf.setDrawColor(20, 20, 20);
  pdf.setLineWidth(0.7);
  pdf.rect(cardX, cardY, cardW, cardH);

  const titleX = 70;
  const titleY = 70;
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(26);
  pdf.text('Your Travel Authorisation', titleX, titleY);

  const photoX = 70;
  const photoY = 95;
  const photoW = 190;
  const photoH = 190;
  if (source && crop) {
    const temp = document.createElement('canvas');
    const r = cropRect(crop);
    const drawW = Math.max(180, Math.min(280, r.w || 200));
    const drawH = Math.max(180, Math.min(280, r.h || 200));
    temp.width = Math.round(drawW);
    temp.height = Math.round(drawH);
    const ctx = temp.getContext('2d');
    ctx.fillStyle = '#e5e5e5';
    ctx.fillRect(0, 0, temp.width, temp.height);
    ctx.drawImage(source, r.x, r.y, r.w, r.h, 0, 0, temp.width, temp.height);
    pdf.addImage(temp.toDataURL('image/png'), 'PNG', photoX, photoY, photoW, photoH);
  } else {
    pdf.setFillColor(224, 224, 224);
    pdf.rect(photoX, photoY, photoW, photoH, 'F');
  }

  const qrX = 325;
  const qrY = 105;
  const qrSize = 130;
  const qrCanvas = document.createElement('canvas');
  qrCanvas.width = 180;
  qrCanvas.height = 180;
  const qrCtx = qrCanvas.getContext('2d');
  qrCtx.fillStyle = '#fff';
  qrCtx.fillRect(0, 0, qrCanvas.width, qrCanvas.height);
  const qr = qrcode(0, 'M');
  qr.addData(`REFERENCE:${data.reference}\nNAME:${data.firstName} ${data.lastName}\nPASSPORT:${data.passportNumber}\nISSUER:${data.issuer}\nDATE:${data.arrivalDate}\nPURPOSE:${data.purpose}`, 'Byte');
  qr.make();
  const module = qr.getModuleCount();
  const cell = qrCanvas.width / module;
  qrCtx.fillStyle = '#000';
  for (let r = 0; r < module; r++) {
    for (let c = 0; c < module; c++) {
      if (qr.isDark(r, c)) {
        qrCtx.fillRect(c * cell, r * cell, cell + 1, cell + 1);
      }
    }
  }
  pdf.addImage(qrCanvas.toDataURL('image/png'), 'PNG', qrX, qrY, qrSize, qrSize);

  const leftX = 70;
  const rightX = 310;
  const lineColor = [180, 180, 180];

  pdf.setDrawColor(...lineColor);
  pdf.setLineWidth(0.8);
  pdf.line(cardX + 15, 314, cardX + cardW - 15, 314);

  const drawField = (label, value, x, y, strong = false) => {
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(label, x, y);
    pdf.setFont('helvetica', strong ? 'bold' : 'normal');
    pdf.setFontSize(strong ? 13 : 12);
    pdf.text(String(value || '').toUpperCase(), x, y + 22);
  };

  drawField('FIRST NAME', data.firstName, leftX, 320, true);
  drawField('LAST NAME', data.lastName, rightX, 320, true);
  pdf.line(cardX + 15, 355, cardX + cardW - 15, 355);

  drawField('ISSUER', data.issuer, leftX, 372, true);
  drawField('PASSPORT NUMBER', data.passportNumber, rightX, 372, true);
  pdf.line(cardX + 15, 410, cardX + cardW - 15, 410);

  drawField('TYPE', data.type, leftX, 423, true);
  drawField('NUMBER OF ENTRIES', data.entries, rightX, 423, true);
  pdf.line(cardX + 15, 460, cardX + cardW - 15, 460);

  const refDate = data.arrivalDate ? data.arrivalDate.toUpperCase() : '';
  drawField('ARRIVAL DATE', refDate === '2026-10-26' ? '26 OCT 2026' : refDate.replace(/-/g, ' '), leftX, 474, true);
  drawField('PURPOSE OF VISIT', data.purpose, rightX, 474, true);
  pdf.line(cardX + 15, 510, cardX + cardW - 15, 510);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('REFERENCE:', 330, 275);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(String(data.reference || '').toUpperCase(), 420, 275);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Security-paper rosette: a family of rotated rose curves. */
function guilloche(ctx, cx, cy, radius, petals, turns) {
  ctx.save();
  ctx.strokeStyle = 'rgba(31, 77, 63, 0.085)';
  ctx.lineWidth = 1.3;
  for (let k = 0; k < turns; k++) {
    const phase = (k / turns) * Math.PI * 2;
    ctx.beginPath();
    for (let i = 0; i <= 720; i++) {
      const t = (i / 720) * Math.PI * 2;
      const r = radius * (0.62 + 0.38 * Math.cos(petals * t + phase));
      const x = cx + r * Math.cos(t);
      const y = cy + r * Math.sin(t);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function fitText(ctx, text, x, y, maxWidth, size, weight, family = SANS) {
  let px = size;
  do {
    ctx.font = `${weight} ${px}px ${family}`;
    px -= 2;
  } while (ctx.measureText(text).width > maxWidth && px > 16);
  ctx.fillText(text, x, y);
}

function field(ctx, label, value, x, y, maxWidth, family = SANS) {
  ctx.fillStyle = C.muted;
  ctx.font = `400 26px ${SANS}`;
  ctx.fillText(label, x, y);
  ctx.fillStyle = C.ink;
  fitText(ctx, value || 'Not read', x, y + 46, maxWidth, 36, value ? 700 : 400, value ? family : SANS);
}

function drawQr(ctx, text, x, y, size) {
  const qr = qrcode(0, 'M');
  qr.addData(text, 'Byte');
  qr.make();
  const count = qr.getModuleCount();
  const pad = 14;
  const cell = (size - pad * 2) / count;
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, x, y, size, size, 8);
  ctx.fill();
  ctx.fillStyle = C.ink;
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) ctx.fillRect(x + pad + c * cell, y + pad + r * cell, cell + 0.4, cell + 0.4);
    }
  }
}

function drawPortrait(ctx, source, crop, x, y, w, h) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 10);
  ctx.clip();
  ctx.fillStyle = '#DCE5DF';
  ctx.fillRect(x, y, w, h);
  if (source && crop) {
    const r = cropRect(crop);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, r.x, r.y, r.w, r.h, x, y, w, h);
  } else {
    ctx.fillStyle = '#B9C8BF';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.4, w * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h * 1.02, w * 0.4, h * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 3;
  roundRect(ctx, x, y, w, h, 10);
  ctx.stroke();
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{fields: object, trip: object, source: HTMLCanvasElement|null, crop: object|null,
 *          checksPassed: number|null, readOn: Date}} data
 */
export function drawCard(canvas, { fields, trip, source, crop, checksPassed, readOn }) {
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'alphabetic';

  // Paper
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  guilloche(ctx, 1290, 430, 560, 9, 14);
  guilloche(ctx, 250, 880, 300, 7, 10);

  // Header
  ctx.fillStyle = C.cover;
  ctx.font = `700 44px ${SANS}`;
  ctx.fillText('Passport summary', 72, 104);
  ctx.textAlign = 'right';
  ctx.font = `700 44px ${MONO}`;
  ctx.fillText(fields.issuingState || fields.nationality || '', CARD_W - 72, 92);
  ctx.fillStyle = C.muted;
  ctx.font = `400 26px ${SANS}`;
  ctx.fillText(countryName(fields.issuingState || fields.nationality), CARD_W - 72, 126);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.gold;
  ctx.fillRect(72, 148, CARD_W - 144, 3);

  // Portrait and read notes
  drawPortrait(ctx, source, crop, 72, 190, 392, 504);
  ctx.fillStyle = C.muted;
  ctx.font = `400 26px ${SANS}`;
  ctx.fillText(`Read on ${DATE.format(readOn)}`, 72, 742);
  if (checksPassed !== null) ctx.fillText(`Check digits passed: ${checksPassed} of 5`, 72, 776);

  // Details
  const X = 520;
  ctx.fillStyle = C.muted;
  ctx.fillText('Surname', X, 216);
  ctx.fillStyle = C.ink;
  fitText(ctx, fields.surname || 'Not read', X, 280, 1000, 62, 700);
  ctx.fillStyle = C.muted;
  ctx.font = `400 26px ${SANS}`;
  ctx.fillText('Given names', X, 334);
  ctx.fillStyle = C.ink;
  fitText(ctx, fields.givenNames || 'Not read', X, 384, 1000, 42, 400);

  const cols = [X, 900, 1280];
  field(ctx, 'Passport number', fields.passportNumber, cols[0], 462, 340, MONO);
  field(ctx, 'Nationality', countryName(fields.nationality), cols[1], 462, 340);
  field(ctx, 'Sex', { M: 'Male', F: 'Female', X: 'Unspecified' }[fields.sex] || '', cols[2], 462, 250);
  field(ctx, 'Date of birth', prettyDate(fields.dateOfBirth), cols[0], 582, 340);
  field(ctx, 'Passport expires', prettyDate(fields.expiryDate), cols[1], 582, 340);
  if (trip.plannedArrival) field(ctx, 'Planned arrival', prettyDate(trip.plannedArrival), cols[0], 702, 340);
  if (trip.purpose) field(ctx, 'Purpose of trip', trip.purpose, cols[1], 702, 380);

  drawQr(ctx, qrText(fields, trip), 1322, 660, 206);

  // Footer strip
  ctx.fillStyle = C.cover;
  ctx.fillRect(0, 908, CARD_W, 92);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 27px ${SANS}`;
  ctx.fillText('Not a travel document.', 72, 964);
  const lead = ctx.measureText('Not a travel document. ').width;
  ctx.font = `400 27px ${SANS}`;
  ctx.fillText('Details were read from an uploaded image and are unverified.', 72 + lead, 964);

  // Specimen stamp, drawn last so it sits over everything
  ctx.save();
  ctx.translate(CARD_W / 2 + 40, 520);
  ctx.rotate((-13 * Math.PI) / 180);
  ctx.textAlign = 'center';
  ctx.font = `700 210px ${SANS}`;
  ctx.fillStyle = 'rgba(180, 35, 42, 0.12)';
  ctx.strokeStyle = 'rgba(180, 35, 42, 0.55)';
  ctx.lineWidth = 3.5;
  ctx.fillText('SPECIMEN', 0, 70);
  ctx.strokeText('SPECIMEN', 0, 70);
  ctx.restore();
}
