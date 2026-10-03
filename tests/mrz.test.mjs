import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDownloadName } from '../js/card.js';
import { extractFallbackFieldsFromText } from '../js/ocr.js';
import { checkDigit, findMrz, parseTd3, repairLine2, mrzDate } from '../js/mrz.js';

// ICAO 9303 part 4 specimen (fictional state "Utopia").
const L1 = 'P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<';
const L2 = 'L898902C36UTO7408122F1204159ZE184226B<<<<<10';
const TODAY = new Date('2026-10-03');

test('builds a safe passport PDF filename from extracted details', () => {
  assert.equal(
    buildDownloadName({ surname: 'ÖSTBERG', givenNames: 'MIA', passportNumber: 'L898902C3' }),
    'OSTBERG-MIA-L898902C3.pdf',
  );
});

test('check digit matches the ICAO specimen', () => {
  assert.equal(checkDigit('L898902C3'), '6');
  assert.equal(checkDigit('740812'), '2');
  assert.equal(checkDigit('120415'), '9');
  assert.equal(checkDigit('ZE184226B<<<<<'), '1');
});

test('parses the ICAO specimen', () => {
  const { fields, checks } = parseTd3(L1, L2, TODAY);
  assert.deepEqual(fields, {
    documentType: 'P',
    issuingState: 'UTO',
    surname: 'ERIKSSON',
    givenNames: 'ANNA MARIA',
    passportNumber: 'L898902C3',
    nationality: 'UTO',
    dateOfBirth: '1974-08-12',
    sex: 'F',
    expiryDate: '2012-04-15',
    personalNumber: 'ZE184226B',
  });
  assert.ok(Object.values(checks).every(Boolean));
});

test('an empty personal number may carry a filler check digit', () => {
  const number = 'X1234567<';
  const body = `${number}${checkDigit(number)}UTO9001011M3001012<<<<<<<<<<<<<<<`;
  const composite = body.slice(0, 10) + body.slice(13, 20) + body.slice(21, 43);
  const { checks } = parseTd3(null, body + checkDigit(composite), TODAY);
  assert.ok(checks.personalNumber && checks.composite);
});

test('finds the MRZ inside noisy OCR text', () => {
  const text = ['REPUBLIC OF UTOPIA', 'Surname ERIKSSON', `  ${L1.replace(/<{8}$/, 'KKKKKKKK')}`, L2.split('').join(' ')].join('\n');
  const found = findMrz(text);
  assert.equal(found.line2, L2);
  const { fields } = parseTd3(found.line1, found.line2, TODAY);
  assert.equal(fields.surname, 'ERIKSSON');
  assert.equal(fields.givenNames, 'ANNA MARIA');
});

test('repairs letter/digit confusion and a shortened filler run', () => {
  // O for 0 in the dates, S for 5 in a check digit, three fillers dropped.
  const noisy = 'L898902C36UTO74O8122F12O41S9ZE184226B<<10';
  assert.equal(repairLine2(noisy), L2);
});

test('repairs a single look-alike in the document number', () => {
  assert.equal(repairLine2(L2.replace('L898902C3', 'L8989O2C3')), L2);
});

test('returns null when there is no MRZ', () => {
  assert.equal(findMrz('just some text\nwith no machine readable zone'), null);
});

test('extracts passport details from OCR text when the MRZ is only partially recognized', () => {
  const text = [
    'P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<',
    'L898902C36UTO7408122F1204159ZE184226B<<<<<10',
    'Passport number: L898902C3',
  ].join('\n');
  const fields = extractFallbackFieldsFromText(text);
  assert.equal(fields.surname, 'ERIKSSON');
  assert.equal(fields.givenNames, 'ANNA MARIA');
  assert.equal(fields.passportNumber, 'L898902C3');
});

test('dates pick a sensible century and reject impossible days', () => {
  assert.equal(mrzDate('870120', 'birth', TODAY), '1987-01-20');
  assert.equal(mrzDate('150301', 'birth', TODAY), '2015-03-01');
  assert.equal(mrzDate('270826', 'expiry', TODAY), '2027-08-26');
  assert.equal(mrzDate('990231', 'birth', TODAY), '');
});

test('drops stray characters read before and after the lines', () => {
  const found = findMrz(`0L90${L1}F0\n4 ${L2}0F`);
  assert.equal(found.line1, L1);
  assert.equal(found.line2, L2);
});

test('does not anchor on a document number that ends in a filler', () => {
  // Seven digits followed by "<" looks like the date block; the real one has a sex letter.
  const number = 'R8151132<';
  const body = `${number}${checkDigit(number)}UTO8701200M2708263<<<<<<<<<<<<<<<`;
  const line2 = body + checkDigit(body.slice(0, 10) + body.slice(13, 20) + body.slice(21, 43));
  assert.equal(repairLine2(line2), line2);
  assert.equal(repairLine2(`9${line2}`), line2);
});

test('a misread nationality is corrected from the issuing state', () => {
  const found = findMrz(`${L1}\n${L2.replace('6UTO', '6UT0').replace('UT0', 'UYO')}`);
  assert.equal(found.line2, L2);
});

test('a misread leading P is restored', () => {
  assert.equal(findMrz(`M4B${L1.slice(1)}\n${L2}`).line1, L1);
});
