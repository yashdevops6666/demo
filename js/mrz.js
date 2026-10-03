// Machine-readable zone (MRZ) parsing for passport data pages (ICAO 9303, TD3).
// Pure functions, no DOM — used by the browser app and by the node tests.
import { isStateCode } from './countries.js';

const WEIGHTS = [7, 3, 1];

// Characters OCR commonly confuses between letters and digits.
const TO_DIGIT = { O: '0', Q: '0', D: '0', I: '1', L: '1', Z: '2', S: '5', G: '6', B: '8' };
const TO_ALPHA = { 0: 'O', 1: 'I', 2: 'Z', 5: 'S', 6: 'G', 8: 'B' };
const AMBIGUOUS = { O: '0', 0: 'O', I: '1', 1: 'I', S: '5', 5: 'S', B: '8', 8: 'B', Z: '2', 2: 'Z', G: '6', 6: 'G' };

function charValue(ch) {
  if (ch >= '0' && ch <= '9') return ch.charCodeAt(0) - 48;
  if (ch >= 'A' && ch <= 'Z') return ch.charCodeAt(0) - 55;
  return 0; // filler '<'
}

/** ICAO 9303 check digit (weights 7-3-1, modulo 10). */
export function checkDigit(str) {
  let sum = 0;
  for (let i = 0; i < str.length; i++) sum += charValue(str[i]) * WEIGHTS[i % 3];
  return String(sum % 10);
}

const digitize = (s) => s.replace(/[OQDILZSGB]/g, (c) => TO_DIGIT[c]);
const alphabetize = (s) => s.replace(/[012568]/g, (c) => TO_ALPHA[c]);
const clean = (s) => s.toUpperCase().replace(/[^A-Z0-9<]/g, '');

/** Where the birth-date / sex / expiry block starts, or -1. Prefers a real sex letter near column 13. */
function findAnchor(s) {
  const probe = digitize(s).replace(/[HN](?=\d{7})/g, 'M');
  const pattern = /(?=\d{7}[MFX<]\d{7})/g;
  let best = null;
  for (let m = pattern.exec(probe); m; m = pattern.exec(probe)) {
    const cost = Math.abs(m.index - 13) + (probe[m.index + 7] === '<' ? 3 : 0);
    if (!best || cost < best.cost) best = { index: m.index, cost };
    pattern.lastIndex = m.index + 1;
  }
  return best ? best.index : -1;
}

/** The document number if its check digit holds, allowing one look-alike swap; otherwise null. */
function settleNumber(number, check) {
  if (checkDigit(number) === check) return number;
  const fixes = [];
  for (let i = 0; i < number.length; i++) {
    const swap = AMBIGUOUS[number[i]];
    if (!swap) continue;
    const candidate = number.slice(0, i) + swap + number.slice(i + 1);
    if (checkDigit(candidate) === check) fixes.push(candidate);
  }
  return fixes.length === 1 ? fixes[0] : null;
}

/**
 * Rebuild a 44-character second line from a noisy OCR reading: re-align on the
 * birth-date / sex / expiry block, drop stray characters picked up before the line,
 * normalise the filler run, and fix letter/digit confusions where the type is known.
 */
export function repairLine2(raw) {
  const s = clean(raw);
  const anchor = findAnchor(s);
  if (anchor < 0) return s.slice(0, 44).padEnd(44, '<');

  // The anchor block: birth date, check, sex, expiry, check.
  const block = s.slice(anchor, anchor + 15).split('');
  for (const i of [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14]) block[i] = digitize(block[i]);
  if (!'MFX<'.includes(block[7])) block[7] = /[HN]/.test(block[7]) ? 'M' : '<';

  // After it: optional data (14), its check digit, composite check digit.
  let rest = s.slice(anchor + 15);
  if (rest.length >= 16) {
    rest = rest.slice(0, 16);
  } else {
    const last2 = rest.slice(-2).padStart(2, '<');
    rest = rest.slice(0, -2).replace(/<+$/, '').padEnd(14, '<') + last2;
  }
  const optionalCheck = rest[14] === '<' ? '<' : digitize(rest[14]);
  const tail = block.join('') + rest.slice(0, 14) + optionalCheck + digitize(rest[15]);

  // Before the anchor: document number (9), its check digit, nationality (3). Stray
  // characters may precede the number, so try each offset and keep the reading whose
  // check digits agree best, preferring a nationality that is exactly three characters.
  const prefix = s.slice(0, anchor);
  const assemble = (p) => {
    const check = digitize(p[9] || '<');
    const number = p.slice(0, 9).padEnd(9, '<');
    const nationality = alphabetize(p.slice(10)).replace(/[^A-Z<]/g, '<').slice(-3).padEnd(3, '<');
    return (settleNumber(number, check) || number) + check + nationality + tail;
  };
  let best = null;
  for (let skip = 0; skip <= 4 && (skip === 0 || prefix.length - skip >= 10); skip++) {
    const p = prefix.slice(skip);
    const line = assemble(p);
    const passed = (checkDigit(line.slice(0, 9)) === line[9] ? 2 : 0) + (compositeOk(line) ? 2 : 0);
    const score = passed - Math.abs(p.length - 13) * 0.5 - skip * 0.01;
    if (!best || score > best.score) best = { line, score };
  }
  return best.line;
}

const compositeOk = (l2) => checkDigit(l2.slice(0, 10) + l2.slice(13, 20) + l2.slice(21, 43)) === l2[43];

/** Normalise a noisy first line to 44 characters starting at the document code. */
export function repairLine1(raw) {
  let s = clean(raw);
  let start = s.search(/P[A-Z<][A-Z][A-Z<]{2}[A-Z]/);
  if (start < 0 || start > 8) {
    // The leading P itself was misread: look for "<" + state code instead.
    const alt = s.search(/[A-Z0-9]<[A-Z]{3}[A-Z]/);
    start = alt >= 0 && alt <= 8 ? alt : 0;
  }
  s = 'P' + s.slice(start + 1);
  s = s.slice(0, 2) + alphabetize(s.slice(2));
  return s.slice(0, 44).padEnd(44, '<');
}

const oneApart = (a, b) => a.length === 3 && b.length === 3 && [0, 1, 2].filter((i) => a[i] !== b[i]).length === 1;

/**
 * Find the two MRZ lines in free OCR text.
 * Returns { line1, line2, score } (line1 may be null) or null when nothing looks like an MRZ.
 */
export function findMrz(text) {
  const lines = text
    .split(/\r?\n/)
    .map(clean)
    .filter((l) => l.length >= 20);
  let best = null;
  for (let i = 0; i < lines.length; i++) {
    if (findAnchor(lines[i]) < 0) continue;
    let line2 = repairLine2(lines[i]);
    let line1 = null;
    for (let j = i - 1; j >= 0 && j >= i - 2; j--) {
      if (lines[j].includes('<<')) {
        line1 = repairLine1(lines[j]);
        break;
      }
    }
    // Neither state code is covered by a check digit. When the two differ by a single
    // character and only one is a real code, the other is almost certainly a misread.
    if (line1) {
      const issuer = line1.slice(2, 5);
      const nationality = line2.slice(10, 13);
      if (oneApart(issuer, nationality) && isStateCode(issuer) !== isStateCode(nationality)) {
        if (isStateCode(issuer)) line2 = line2.slice(0, 10) + issuer + line2.slice(13);
        else line1 = line1.slice(0, 2) + nationality + line1.slice(5);
      }
    }
    const candidate = { line1, line2 };
    const score = scoreMrz(candidate);
    if (!best || score > best.score) best = { ...candidate, score };
  }
  return best;
}

/** Higher is better: one point per passing check digit, one for a name line, one for a real state code. */
export function scoreMrz({ line1, line2 }) {
  const { checks, fields } = parseTd3(line1, line2);
  return (
    Object.values(checks).filter(Boolean).length + (line1 ? 1 : 0) + (isStateCode(fields.nationality) ? 1 : 0)
  );
}

/** Top score: every check digit passes, both lines were found, the nationality is a real code. */
export const FULL_SCORE = 7;

function parseNames(field) {
  const [rawSurname, ...rest] = field.split('<<');
  const tokens = rest.join('<<').split('<').filter(Boolean);
  // Trailing filler is sometimes read as a run of K, C or L.
  while (tokens.length && /^(K+|C+|L+|[KC]{3,})$/.test(tokens[tokens.length - 1])) tokens.pop();
  return {
    surname: rawSurname.replace(/</g, ' ').trim(),
    givenNames: tokens.join(' '),
  };
}

/** YYMMDD → ISO date, or '' when the digits are not a real date. */
export function mrzDate(yymmdd, kind, today = new Date()) {
  if (!/^\d{6}$/.test(yymmdd)) return '';
  const yy = Number(yymmdd.slice(0, 2));
  const mm = Number(yymmdd.slice(2, 4));
  const dd = Number(yymmdd.slice(4, 6));
  const thisYear = today.getFullYear();
  let year = 2000 + yy;
  if (kind === 'birth' && year > thisYear) year -= 100;
  if (kind === 'expiry' && year > thisYear + 50) year -= 100;
  const date = new Date(Date.UTC(year, mm - 1, dd));
  if (date.getUTCMonth() !== mm - 1 || date.getUTCDate() !== dd) return '';
  return `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

/** Parse two 44-character TD3 lines into fields and check-digit results. */
export function parseTd3(line1, line2, today = new Date()) {
  const l1 = line1 ? line1.padEnd(44, '<') : null;
  const l2 = line2.padEnd(44, '<');

  const number = l2.slice(0, 9);
  const birth = l2.slice(13, 19);
  const expiry = l2.slice(21, 27);
  const optional = l2.slice(28, 42);
  const composite = l2.slice(0, 10) + l2.slice(13, 20) + l2.slice(21, 43);
  const optionalCheck = l2[42];

  const names = l1 ? parseNames(l1.slice(5)) : { surname: '', givenNames: '' };
  return {
    fields: {
      documentType: l1 ? l1.slice(0, 2).replace(/</g, '') : 'P',
      issuingState: l1 ? l1.slice(2, 5).replace(/</g, '') : '',
      surname: names.surname,
      givenNames: names.givenNames,
      passportNumber: number.replace(/</g, ''),
      nationality: l2.slice(10, 13).replace(/</g, ''),
      dateOfBirth: mrzDate(birth, 'birth', today),
      sex: l2[20] === '<' ? 'X' : l2[20],
      expiryDate: mrzDate(expiry, 'expiry', today),
      personalNumber: optional.replace(/</g, ''),
    },
    checks: {
      passportNumber: checkDigit(number) === l2[9],
      dateOfBirth: checkDigit(birth) === l2[19],
      expiryDate: checkDigit(expiry) === l2[27],
      personalNumber:
        checkDigit(optional) === optionalCheck || (optionalCheck === '<' && /^<+$/.test(optional)),
      composite: checkDigit(composite) === l2[43],
    },
    line1: l1,
    line2: l2,
  };
}

/** Positions in line 2 that hold check digits, mapped to the check they belong to. */
export const CHECK_POSITIONS = {
  9: 'passportNumber',
  19: 'dateOfBirth',
  27: 'expiryDate',
  42: 'personalNumber',
  43: 'composite',
};
