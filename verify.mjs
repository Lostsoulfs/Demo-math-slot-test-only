import { chromium } from 'playwright';

// Smoke test: load the built site, exercise the real game flow + debug panel,
// screenshot each state, and fail on any console error.
const url = 'http://localhost:4173/?debug=1';
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 800, height: 1000 },
  deviceScaleFactor: 1,
});

const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(2500);

const has = await page.evaluate(() => !!window.__slot);
console.log('slot api present:', has);

// debug panel + FPS meter present (loaded via ?debug=1)
const guiPresent = await page.evaluate(
  () => !!document.querySelector('.lil-gui') && !!document.querySelector('canvas'),
);
console.log('debug panel present:', guiPresent);

if (has) {
  await page.screenshot({ path: 'shot-idle.png' });

  // mid-spin shot
  page.evaluate(() => window.__slot.doSpin());
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'shot-spinning.png' });
  await page.waitForTimeout(3500);

  // force an EPIC win through the real spin->resolve flow
  page.evaluate(() => window.__slot.forceLineWin('seven'));
  await page.waitForTimeout(4500);
  await page.screenshot({ path: 'shot-epicwin.png' });

  // theme switch
  await page.evaluate(() => window.__slot.applyTheme('neon'));
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'shot-theme-neon.png' });
  await page.evaluate(() => window.__slot.applyTheme('classic'));

  // bonus scene
  page.evaluate(() => window.__slot.runBonus(7));
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'shot-bonus.png' });

  const bal = await page.evaluate(() => window.__slot.state.balance);
  console.log('balance:', bal);
}

console.log('--- total console errors:', errors.length);
errors.slice(0, 30).forEach((e) => console.log('  -', e));
await browser.close();
process.exit(has && guiPresent && errors.length === 0 ? 0 : 1);
