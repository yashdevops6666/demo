// Renders sample/specimen-passport.png: a made-up passport page for the fictional
// state of Utopia (ICAO's specimen code UTO), with valid check digits.
// Usage: npm i --no-save playwright && node tools/make-specimen.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { checkDigit } from '../js/mrz.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const person = {
  surname: 'MERIDIAN',
  given: 'ROWAN ALEX',
  number: 'X4K29T7P1',
  birth: '900314',
  sex: 'F',
  expiry: '310630',
};

const line1 = `P<UTO${person.surname}<<${person.given.replace(/ /g, '<')}`.padEnd(44, '<');
const optional = '<'.repeat(14);
let line2 =
  person.number + checkDigit(person.number) + 'UTO' +
  person.birth + checkDigit(person.birth) + person.sex +
  person.expiry + checkDigit(person.expiry) + optional + '<';
line2 += checkDigit(line2.slice(0, 10) + line2.slice(13, 20) + line2.slice(21, 43));

// Fonts are inlined: a page set with setContent cannot load file:// URLs.
const font = (file) =>
  `data:font/woff2;base64,${fs.readFileSync(path.join(root, 'vendor/fonts', file)).toString('base64')}`;
const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:B612;src:url(${font('b612-latin-400-normal.woff2')});font-weight:400}
@font-face{font-family:B612;src:url(${font('b612-latin-700-normal.woff2')});font-weight:700}
@font-face{font-family:"B612 Mono";src:url(${font('b612-mono-latin-400-normal.woff2')})}
*{box-sizing:border-box;margin:0}
body{width:1500px;height:1050px;font-family:B612,sans-serif;color:#1b2a3a;
  background:#e9eef6 repeating-radial-gradient(circle at 78% 42%,rgba(60,90,150,.07) 0 2px,transparent 2px 13px)}
.top{position:absolute;left:75px;right:75px;top:52px;display:flex;justify-content:space-between;align-items:baseline;
  border-bottom:3px solid #3c5a96;padding-bottom:16px}
.top b{font-size:44px;letter-spacing:.04em;color:#27407a}
.top span{font-size:30px;font-weight:700;color:#b4232a;border:3px solid #b4232a;padding:2px 14px;border-radius:6px}
.photo{position:absolute;left:75px;top:201px;width:405px;height:521px;background:#c9d6ea;border:3px solid #9fb2d2;overflow:hidden}
.grid{position:absolute;left:540px;top:205px;right:75px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:26px 30px}
.grid div{font-size:36px;font-weight:700}
.grid small{display:block;font-size:20px;font-weight:400;color:#56657a;margin-bottom:2px}
.wide{grid-column:1/-1}
.mrz{position:absolute;left:60px;right:60px;bottom:58px;font:${process.env.MRZ_FONT || '400 44px/1.6 "B612 Mono",monospace'};letter-spacing:${process.env.MRZ_SPACING || '4px'};
  color:#111;white-space:pre}
</style>
<div class="top"><b>UTOPIA</b><span>SPECIMEN</span><b>PASSPORT</b></div>
<div class="photo"><svg viewBox="0 0 405 521" width="405" height="521">
  <rect width="405" height="521" fill="#c9d6ea"/>
  <path d="M40 521c0-110 70-165 162-165s163 55 163 165z" fill="#27407a"/>
  <rect x="172" y="300" width="62" height="80" rx="24" fill="#e2b48f"/>
  <ellipse cx="203" cy="225" rx="92" ry="112" fill="#edc4a2"/>
  <path d="M108 215c-8-95 50-140 100-138 62 2 100 50 92 132-18-48-48-70-98-72-46-2-76 28-94 78z" fill="#3a2a22"/>
  <ellipse cx="168" cy="232" rx="10" ry="7" fill="#2b2b2b"/><ellipse cx="238" cy="232" rx="10" ry="7" fill="#2b2b2b"/>
  <path d="M172 285q31 22 62 0" fill="none" stroke="#9c5a4a" stroke-width="6" stroke-linecap="round"/>
</svg></div>
<div class="grid">
  <div><small>Type</small>P</div><div><small>Country code</small>UTO</div><div><small>Passport no.</small>${person.number}</div>
  <div class="wide"><small>Surname</small>${person.surname}</div>
  <div class="wide"><small>Given names</small>${person.given}</div>
  <div><small>Nationality</small>UTOPIAN</div><div><small>Sex</small>${person.sex}</div><div><small>Date of birth</small>14/03/1990</div>
  <div><small>Place of birth</small>ZENITH</div><div><small>Date of issue</small>01/07/2021</div><div><small>Date of expiry</small>30/06/2031</div>
</div>
<div class="mrz">${line1.replace(/</g, '&lt;')}
${line2.replace(/</g, '&lt;')}</div>`;

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1500, height: 1050 } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(root, 'sample/specimen-passport.png') });
await browser.close();
console.log(line1 + '\n' + line2);
