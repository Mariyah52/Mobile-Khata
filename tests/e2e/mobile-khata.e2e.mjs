// Mobile Khata — automated end-to-end check (demo mode, no real Firebase).
// Usage: node mobile-khata.e2e.mjs <site-url> <screenshot-dir> [label]
// Runs the main business flows, checks for JavaScript errors, old brand names,
// and text that is hard to read, then prints a JSON result.
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const [, , SITE, OUT, LABEL = 'run'] = process.argv;
const STUBS = process.env.FIREBASE_STUBS || path.join(path.dirname(new URL(import.meta.url).pathname), 'firebase-stubs'); // offline stand-ins for Firebase
fs.mkdirSync(OUT, { recursive: true });

const results = []; // { name, ok, detail }
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail: String(detail) }); };
const values = {};  // business numbers, compared between old and new versions

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
await ctx.route(/cdnjs|googleapis|gstatic/, r => r.abort());
if (STUBS) await ctx.route(/gstatic\.com\/firebasejs\/[\d.]+\/([\w-]+)\.js/, r => {
  const name = r.request().url().match(/([\w-]+)\.js$/)[1];
  r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(STUBS, `${name}.js`), 'utf8') });
});
const page = await ctx.newPage();
const jsErrors = [];
page.on('pageerror', e => jsErrors.push(e.message.slice(0, 200)));
page.on('dialog', d => d.accept());
// Offline test: give the app a dummy Firebase config so it shows the normal login screen
// even before the real project values are filled in (the stubs never contact Firebase).
await page.addInitScript(() => { try { localStorage.setItem('saas_fbcfg_dev', JSON.stringify({ apiKey: 'test', projectId: 'test' })); } catch {} });
const shot = name => page.screenshot({ path: path.join(OUT, `${LABEL}-${name}.png`) });
const visibleText = () => page.evaluate(() => document.body.innerText);
const oldBrand = new RegExp(['ma'+'flow','al'+'ico','im'+'adi'].join('|'), 'i'); // old names must never show

// Readability: every visible text element vs. its real background (WCAG contrast ratio)
const lowContrast = () => page.evaluate(() => {
  const rgb = s => (s.match(/[\d.]+/g) || []).map(Number);
  const lum = ([r, g, b]) => [r, g, b].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; })
    .reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
  const bgOf = el => {
    for (let e = el; e; e = e.parentElement) {
      const c = getComputedStyle(e).backgroundColor; const v = rgb(c);
      if (v.length >= 3 && (v.length < 4 || v[3] > 0.5)) return v;
    }
    return [255, 255, 255];
  };
  const bad = [];
  for (const el of document.querySelectorAll('body *')) {
    const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!own) continue;
    const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    if (!r.width || !r.height || cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < .5) continue;
    if (r.bottom < 0 || r.top > innerHeight) continue;
    const L1 = lum(rgb(cs.color)), L2 = lum(bgOf(el));
    const ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
    const big = parseFloat(cs.fontSize) >= 18 || (parseFloat(cs.fontSize) >= 14 && +cs.fontWeight >= 700);
    if (ratio < (big ? 3 : 4.5)) bad.push(`${el.textContent.trim().slice(0, 30)} (${ratio.toFixed(1)})`);
  }
  return bad;
});

async function go(view) { await page.evaluate(v => window.go(v), view); await page.waitForTimeout(400); }
async function clickText(re) { await page.getByRole('button', { name: re }).first().click(); await page.waitForTimeout(400); }

// 1. Login screen
await page.goto(SITE); await page.waitForTimeout(1500);
const loginText = await visibleText();
check('Login screen shows', /Sign In/i.test(loginText), loginText.slice(0, 60));
values.title = await page.title();
values.loginBrand = (await page.locator('#loginTitle').innerText().catch(() => '')).trim();
check('No old brand name on login screen', !oldBrand.test(loginText), loginText.match(oldBrand)?.[0] || '');
const loginBad = await lowContrast();
check('Login text readable (contrast)', loginBad.length === 0, loginBad.slice(0, 5).join('; '));
await shot('01-login');

// 2. Demo workspace
await page.evaluate(() => localStorage.setItem('mk_demo', '1'));
await page.reload(); await page.waitForTimeout(1800);
const tabs = await page.$$eval('.nav-tab', t => t.map(x => x.textContent.trim()));
values.tabs = tabs.length;
check('Workspace opens with menu tabs', tabs.length >= 10, `${tabs.length} tabs`);
await shot('02-dashboard');

// 3. Add a customer
await go('parties'); await clickText(/Add Customer/);
await page.fill('#pName', 'Test Traders'); await page.fill('#pPhone', '03001234567');
await clickText(/Save/);
check('Customer saved', (await visibleText()).includes('Test Traders'));

// 4. Add a product
await go('products'); await clickText(/Add Product/);
await page.fill('#prName', 'Steel Pipe'); await page.fill('#prSale', '1000'); await page.fill('#prStock', '50');
await clickText(/Save/);
check('Product saved', (await visibleText()).includes('Steel Pipe'));
await shot('03-products');

// 5. Quotation and invoice with one item (qty 2 x 1000)
async function makeDoc(view, type) {
  await go(view);
  await page.evaluate(t => window.openDocForm(t), type); await page.waitForTimeout(600);
  await page.fill('#fCustName', 'Test Traders');
  const row = page.locator('#itemsBody tr').first().locator('input');
  await row.nth(0).fill('Steel Pipe'); await row.nth(2).fill('2'); await row.nth(3).fill('1000');
  await page.waitForTimeout(300);
  values[`${type}FormText`] = (await page.locator('.modal').innerText()).replace(/\s+/g, ' ').match(/TOTAL[^0-9]*[\d,.]+/i)?.[0] || '';
  if (type === 'Invoice') await shot('04-invoice-form');
  await page.getByRole('button', { name: new RegExp(`Save ${type}`) }).click(); await page.waitForTimeout(700);
  const listText = await visibleText();
  check(`${type} saved and listed`, listText.includes('Test Traders'), '');
  values[`${type}Count`] = (listText.match(/Test Traders/g) || []).length;
}
await makeDoc('quotations', 'Quotation');
await makeDoc('invoices', 'Invoice');
await shot('05-invoices');

// 6. Print view of the invoice
await page.evaluate(() => {
  const db = window.DB || window.STATE || {}; const inv = (db.invoices || [])[0];
  if (inv && window.printDoc) window.printDoc(inv, 'Invoice');
});
await page.waitForTimeout(800);
const printHTML = await page.evaluate(() => document.getElementById('printPortal')?.innerText || '');
check('Invoice print document builds', /Test Traders/.test(printHTML) && /Steel Pipe/.test(printHTML), printHTML.slice(0, 80));
check('No old brand name on printed invoice', !oldBrand.test(printHTML));
await page.evaluate(() => { const p = document.getElementById('printPortal'); if (p) { p.style.display = 'block'; document.querySelectorAll('body > *:not(#printPortal)').forEach(e => e.style.visibility = 'hidden'); } });
await page.screenshot({ path: path.join(OUT, `${LABEL}-06-print.png`), fullPage: false });
await page.evaluate(() => { const p = document.getElementById('printPortal'); if (p) { p.style.display = ''; p.innerHTML = ''; } document.querySelectorAll('body > *').forEach(e => e.style.visibility = ''); });

// 7. Payment received
await go('payments'); await page.evaluate(() => window.openPmtForm()); await page.waitForTimeout(500);
await page.fill('#pmtAmt', '500'); await page.fill('#pmtParty', 'Test Traders');
await clickText(/Save/);
const payText = await visibleText();
check('Payment recorded', /500/.test(payText) && payText.includes('Test Traders'));
values.paymentsPage = payText.replace(/\s+/g, ' ').match(/[\d,.]+\s*Total Received/i)?.[0] || '';

// 8. Dashboard totals
await go('dashboard');
const dash = (await visibleText()).replace(/\s+/g, ' ');
values.dashboardTotals = (dash.match(/PKR\s*[\d,.]+\s*(TOTAL SALES|AMOUNT RECEIVED|PENDING PAYMENT)/gi) || []).join(' | ');
check('Dashboard shows totals', /TOTAL SALES/i.test(dash), values.dashboardTotals);
await shot('07-dashboard-after');

// 9. Every menu page opens without errors; brand and readability on each
const views = ['dashboard', 'quotations', 'challans', 'invoices', 'salestax', 'commercial', 'purchases', 'parties', 'products', 'payments', 'expenses', 'ledger', 'bank', 'reports', 'settings'];
const brandHits = [], unreadable = [];
for (const v of views) {
  const before = jsErrors.length;
  await go(v);
  const t = await visibleText();
  if (oldBrand.test(t)) brandHits.push(`${v}: ${t.match(oldBrand)[0]}`);
  const bad = await lowContrast(); if (bad.length) unreadable.push(`${v}: ${bad.slice(0, 3).join(', ')}`);
  check(`Page "${v}" opens without errors`, jsErrors.length === before, jsErrors.slice(before).join(' | '));
}
await shot('08-settings');
check('No old brand name anywhere in the app', brandHits.length === 0, brandHits.join(' ; '));
check('All app text readable (contrast)', unreadable.length === 0, unreadable.join(' ; '));

// 10. Urdu language
await page.evaluate(() => window.setLang && window.setLang('ur')); await page.waitForTimeout(500);
await go('dashboard'); await shot('09-urdu');
check('Urdu language works', jsErrors.length === 0, jsErrors.join(' | '));

// 11. Data survives a reload (demo mode keeps it on the device)
await page.reload(); await page.waitForTimeout(1500); await go('invoices');
check('Data kept after reload', (await visibleText()).includes('Test Traders'));

check('No JavaScript errors during the whole run', jsErrors.length === 0, jsErrors.join(' | '));
await browser.close();
const passed = results.filter(r => r.ok).length;
fs.writeFileSync(path.join(OUT, `${LABEL}-result.json`), JSON.stringify({ passed, total: results.length, results, values }, null, 2));
console.log(`${LABEL}: ${passed}/${results.length} passed`);
for (const r of results) console.log(`  ${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.ok ? '' : ': ' + r.detail.slice(0, 300)}`);
if (passed !== results.length) process.exit(1);
