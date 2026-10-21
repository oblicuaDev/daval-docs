// Genera las capturas del manual con Playwright.
//   npm run capturas                      → todas
//   npm run capturas -- admin/clientes    → solo las indicadas
// Variables: APP_URL (por defecto http://localhost:5173/pedidos), API_URL (http://localhost:3000),
// CHROME_PATH (por defecto el Chromium que instala `npx playwright install chromium`).
import { chromium } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';
import plan from './plan.mjs';

const BASE = process.env.APP_URL ?? 'http://localhost:5173/pedidos';
const API = process.env.API_URL ?? 'http://localhost:3000';
const OUT = path.resolve(import.meta.dirname, '../../static/img/manual');
const only = new Set(process.argv.slice(2));

function findChromium() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const root = process.platform === 'win32'
    ? path.join(process.env.LOCALAPPDATA, 'ms-playwright')
    : path.join(process.env.HOME, process.platform === 'darwin' ? 'Library/Caches/ms-playwright' : '.cache/ms-playwright');
  const dir = fs.existsSync(root) && fs.readdirSync(root).filter(d => d.startsWith('chromium-')).sort().pop();
  if (!dir) throw new Error('No hay Chromium: corre `npx playwright install chromium` o define CHROME_PATH');
  const bin = { win32: 'chrome-win/chrome.exe', darwin: 'chrome-mac/Chromium.app/Contents/MacOS/Chromium' }[process.platform]
    ?? 'chrome-linux/chrome';
  return path.join(root, dir, bin);
}

// Quita de las respuestas JSON los objetos con algún campo de texto que coincida
function cleaner(rx) {
  const clean = v => Array.isArray(v)
    ? v.filter(x => !(x && typeof x === 'object' && Object.values(x).some(f => typeof f === 'string' && rx.test(f)))).map(clean)
    : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clean(x)])) : v;
  return clean;
}

const browser = await chromium.launch({ executablePath: findChromium() });
for (const session of plan) {
  const shots = session.shots.filter(s => !only.size || only.has(s.name));
  if (!shots.length) continue;

  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    colorScheme: 'dark',
  });
  if (session.filter) {
    const clean = cleaner(session.filter);
    await ctx.route(url => url.href.startsWith(API), async route => {
      const res = await route.fetch();
      if (!(res.headers()['content-type'] ?? '').includes('json')) return route.fulfill({ response: res });
      return route.fulfill({ response: res, json: clean(await res.json()) });
    });
  }
  const page = await ctx.newPage();
  if (session.user) {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type=email]', session.user);
    await page.fill('input[type=password]', session.pass);
    await page.click('button[type=submit]');
    await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 15000 });
  }
  for (const s of shots) {
    try {
      await page.goto(`${BASE}${s.path}`);
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(s.wait ?? 700);
      if (s.before) await s.before(page);
      await page.waitForTimeout(300);
      const file = path.join(OUT, `${s.name}.png`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      await page.screenshot({ path: file });
      console.log('✅', s.name);
    } catch (e) {
      console.log('❌', s.name, e.message.split('\n')[0]);
      process.exitCode = 1;
    }
  }
  await ctx.close();
}
await browser.close();
