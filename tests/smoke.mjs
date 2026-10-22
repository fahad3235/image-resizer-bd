/* image-resizer-bd -- headless-Chrome smoke tests (file:// + raw CDP).
   Usage: node tests/smoke.mjs [--mobile]
   Mobile mode emulates a 390px viewport. */
import { spawn, execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MOBILE = process.argv.includes('--mobile');
const PORT = MOBILE ? 9224 : 9223;
const BASE = fileURLToPath(new URL('..', import.meta.url));
const PAGE_URL = 'file://' + join(BASE, 'index.html');
const CHROME_CANDIDATES = ['chrome', 'google-chrome', 'chromium', 'chromium-browser', '/opt/meta-chromium/chrome'];

function findChrome() {
  for (const c of CHROME_CANDIDATES) {
    try {
      if (c.includes('/')) { execSync('test -x ' + c, { stdio: 'ignore' }); return c; }
      execSync('command -v ' + c, { stdio: 'ignore' }); return c;
    } catch { /* try next */ }
  }
  throw new Error('no chrome binary found');
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function httpJson(url) {
  const res = await fetch(url);
  return res.json();
}
function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();
    ws.onopen = () => resolve({
      send(method, params = {}) {
        return new Promise((res, rej) => {
          const mid = ++id;
          pending.set(mid, { res, rej });
          ws.send(JSON.stringify({ id: mid, method, params }));
        });
      },
      close() { ws.close(); }
    });
    ws.onerror = reject;
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(JSON.stringify(msg.error)));
        else res(msg.result);
      }
    };
  });
}
async function evaluate(client, expr) {
  const r = await client.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error('eval failed: ' + JSON.stringify(r.exceptionDetails).slice(0, 500));
  return r.result.value;
}

let passed = 0;
function check(name, cond, extra = '') {
  if (!cond) throw new Error('FAIL: ' + name + ' ' + extra);
  passed += 1;
  console.log('ok - ' + name);
}

const chrome = findChrome();
const userDataDir = join(tmpdir(), 'ir-smoke-' + PORT + '-' + Date.now());
const proc = spawn(chrome, [
  '--headless=new', '--no-sandbox', '--no-proxy-server',
  '--disable-features=LocalNetworkAccessChecks',
  '--remote-debugging-port=' + PORT,
  '--user-data-dir=' + userDataDir, 'about:blank'
], { stdio: 'ignore', detached: true });

const MAKE_IMAGE = `
(async () => {
  const c = document.createElement('canvas');
  c.width = 800; c.height = 600;
  const x = c.getContext('2d');
  x.fillStyle = '#1a7f37'; x.fillRect(0, 0, 800, 600);
  x.fillStyle = '#ffffff'; x.fillRect(100, 100, 600, 400);
  const blob = await new Promise(r => c.toBlob(r, 'image/png'));
  const file = new File([blob], 'test-800x600.png', { type: 'image/png' });
  const dt = new DataTransfer();
  dt.items.add(file);
  const input = document.getElementById('fileInput');
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return 'injected';
})()`;

const WAIT_FOR = (condExpr, timeoutMs = 8000) => `
(async () => {
  const t0 = Date.now();
  while (Date.now() - t0 < ${timeoutMs}) {
    if ((${condExpr})) return true;
    await new Promise(r => setTimeout(r, 100));
  }
  return false;
})()`;

let failed = null;
try {
  let tabs = [];
  for (let i = 0; i < 50 && tabs.length === 0; i++) {
    try { tabs = (await httpJson('http://127.0.0.1:' + PORT + '/json/list')).filter((t) => t.type === 'page'); }
    catch { await sleep(200); }
  }
  if (!tabs.length) throw new Error('chrome did not start');
  const client = await connect(tabs[0].webSocketDebuggerUrl);
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  if (MOBILE) {
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, deviceScaleFactor: 1, mobile: true
    });
  }
  await client.send('Page.addScriptToEvaluateOnNewDocument', {
    source: 'window.__pageErrors = []; window.addEventListener("error", e => window.__pageErrors.push(e.message || "error")); window.addEventListener("unhandledrejection", e => window.__pageErrors.push("rejection:" + (e.reason && e.reason.message || e.reason))); const _ce = console.error; console.error = function(){ window.__pageErrors.push(Array.from(arguments).join(" ")); _ce.apply(console, arguments); };'
  });
  await client.send('Page.navigate', { url: PAGE_URL });
  await sleep(1500);

  // 1. Static UI
  check('title is Image Resizer BD', await evaluate(client, `document.title === 'Image Resizer BD'`));
  check('privacy banner mentions never leaves device',
    await evaluate(client, `document.querySelector('.privacy').textContent.includes('never leaves this device')`));
  check('empty state visible, controls hidden', await evaluate(client,
    `!document.getElementById('emptyState').hidden && document.getElementById('controlsSection').hidden`));
  check('lang button shows BN', await evaluate(client, `document.getElementById('langBtn').textContent === 'BN'`));

  // 2. Language toggle EN -> BN -> EN
  await evaluate(client, `document.getElementById('langBtn').click(); document.documentElement.lang`);
  check('lang toggle switches to bn', await evaluate(client, `document.documentElement.lang === 'bn'`));
  check('BN title renders', await evaluate(client, `document.querySelector('h1').textContent.length > 0 && document.querySelector('h1').textContent !== 'Image Resizer BD'`));
  await evaluate(client, `document.getElementById('langBtn').click(); 1`);
  check('lang toggle switches back to en', await evaluate(client, `document.documentElement.lang === 'en'`));

  // 3. Upload a generated 800x600 PNG
  check('inject test image', await evaluate(client, MAKE_IMAGE) === 'injected');
  check('original section appears with 800 x 600', await evaluate(client,
    WAIT_FOR(`!document.getElementById('originalSection').hidden && document.getElementById('origDims').textContent.includes('800')`)));
  check('orig dims exact 800 x 600', await evaluate(client,
    `document.getElementById('origDims').textContent.includes('800') && document.getElementById('origDims').textContent.includes('600')`));
  check('width/height inputs prefilled 800/600', await evaluate(client,
    `document.getElementById('widthInput').value === '800' && document.getElementById('heightInput').value === '600'`));

  // 4. Aspect lock: width 400 -> height 300
  await evaluate(client, `(() => { const w = document.getElementById('widthInput'); w.value = '400'; w.dispatchEvent(new Event('input', {bubbles:true})); return 1; })()`);
  check('aspect lock 400 -> height 300', await evaluate(client,
    `document.getElementById('heightInput').value === '300'`));

  // 5. Process exact 400x300, keep PNG
  await evaluate(client, `document.getElementById('processBtn').click(); 1`);
  check('output section appears', await evaluate(client,
    WAIT_FOR(`!document.getElementById('outputSection').hidden`)));
  check('output dims 400 x 300', await evaluate(client,
    `document.getElementById('outDims').textContent.includes('400') && document.getElementById('outDims').textContent.includes('300')`));
  check('download link is blob URL with -resized.png name', await evaluate(client, `
    (() => { const a = document.getElementById('downloadLink');
      return a.href.startsWith('blob:') && a.getAttribute('download') === 'test-800x600-resized.png'; })()`));
  check('output size shown', await evaluate(client,
    `document.getElementById('outSize').textContent.trim().length > 0`));

  // 6. Percent slider 50% on original 800x600 -> 400x300 (reset width first to 800)
  await evaluate(client, `(() => { const w = document.getElementById('widthInput'); w.value = '800'; w.dispatchEvent(new Event('input', {bubbles:true})); return 1; })()`);
  await evaluate(client, `(() => { const p = document.getElementById('percentInput'); p.value = '50'; p.dispatchEvent(new Event('input', {bubbles:true})); return 1; })()`);
  check('percent 50% -> 400x300 inputs', await evaluate(client,
    `document.getElementById('widthInput').value === '400' && document.getElementById('heightInput').value === '300'`));

  // 7. Rotate right then process -> 300x400
  await evaluate(client, `document.getElementById('rotateRightBtn').click(); document.getElementById('processBtn').click(); 1`);
  await sleep(600);
  check('rotated output dims 300 x 400', await evaluate(client,
    `document.getElementById('outDims').textContent.includes('300') && document.getElementById('outDims').textContent.includes('400')`));

  // 8. Fit-inside mode: max side 200 -> 200x150 (rotation reset first)
  await evaluate(client, `document.getElementById('resetBtn').click(); 1`);
  await sleep(300);
  check('reset restores empty state', await evaluate(client,
    `!document.getElementById('emptyState').hidden && document.getElementById('controlsSection').hidden`));
  check('re-inject test image', await evaluate(client, MAKE_IMAGE) === 'injected');
  await evaluate(client, WAIT_FOR(`!document.getElementById('originalSection').hidden`));
  await evaluate(client, `(() => {
    document.querySelector('input[name="fitMode"][value="fit"]').checked = true;
    document.querySelector('input[name="fitMode"][value="fit"]').dispatchEvent(new Event('change', {bubbles:true}));
    const m = document.getElementById('maxSideInput'); m.value = '200'; m.dispatchEvent(new Event('input', {bubbles:true})); return 1; })()`);
  check('fit-inside 200 -> inputs 200x150', await evaluate(client,
    `document.getElementById('widthInput').value === '200' && document.getElementById('heightInput').value === '150'`));
  await evaluate(client, `document.getElementById('processBtn').click(); 1`);
  await sleep(600);
  check('fit-inside output dims 200 x 150', await evaluate(client,
    `document.getElementById('outDims').textContent.includes('200') && document.getElementById('outDims').textContent.includes('150')`));

  // 9. Format WebP conversion
  await evaluate(client, `document.getElementById('formatSelect').value = 'webp'; document.getElementById('formatSelect').dispatchEvent(new Event('change', {bubbles:true})); document.getElementById('processBtn').click(); 1`);
  await sleep(600);
  check('webp output format shown', await evaluate(client,
    `document.getElementById('outFormat').textContent === 'image/webp'`));
  check('webp download name ends .webp', await evaluate(client,
    `document.getElementById('downloadLink').getAttribute('download').endsWith('.webp')`));

  // 10. Invalid file rejected
  await evaluate(client, `document.getElementById('resetBtn').click(); 1`);
  await sleep(300);
  check('invalid text file shows error', await evaluate(client, `
    (() => {
      const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });
      const dt = new DataTransfer(); dt.items.add(file);
      const input = document.getElementById('fileInput');
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`));
  await sleep(300);
  check('file error visible', await evaluate(client, `!document.getElementById('fileError').hidden`));

  // 11. Mobile overflow check (mobile run only)
  if (MOBILE) {
    check('no horizontal overflow at 390px', await evaluate(client,
      `document.documentElement.scrollWidth <= 390`));
  }

  // 12. No page errors
  const errs = await evaluate(client, `window.__pageErrors || []`);
  check('zero page errors', Array.isArray(errs) && errs.length === 0, JSON.stringify(errs).slice(0, 300));

  client.close();
} catch (e) {
  failed = e;
  console.error('SMOKE FAILED: ' + (e && e.message ? e.message : e));
} finally {
  try { proc.kill(); } catch { /* ignore */ }
  try { execSync('rm -rf ' + userDataDir, { stdio: 'ignore' }); } catch { /* ignore */ }
}
if (failed) process.exit(1);
console.log('SMOKE PASS: ' + passed + ' checks' + (MOBILE ? ' (mobile)' : ' (desktop)'));
