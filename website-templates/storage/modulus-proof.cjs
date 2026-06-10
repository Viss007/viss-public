const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const out = { errors: [] };
  try {
    await page.goto('http://127.0.0.1:3333/websites', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.getByRole('button', { name: /Modulus/i }).click();
    await page.waitForSelector('.tpl-modulus', { timeout: 15000 });
    await page.waitForTimeout(2000);
    const metrics = await page.evaluate(() => {
      const hero = document.querySelector('.dvele-hero h1');
      const process = document.querySelector('#process');
      const care = document.querySelector('.dvele-benefit');
      const design = document.querySelector('#design');
      const visible = (el) => {
        if (!el) return { exists: false };
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { exists: true, opacity: s.opacity, height: r.height, inview: el.classList.contains('dvele-inview') };
      };
      return {
        bootFn: typeof window.vissaiModulusPlaygroundBoot,
        heroText: hero?.textContent?.trim() || null,
        hero: visible(hero),
        process: visible(process),
        care: visible(care),
        design: visible(design),
        bootScript: !!document.querySelector('script[src*="modulus-playground-boot"]'),
        visibleCss: !!document.querySelector('link[href*="modulus-playground-visible"]'),
        sectionCount: document.querySelectorAll('.tpl-modulus section').length,
      };
    });
    out.metrics3333 = metrics;
    await page.screenshot({ path: 'C:/Users/Vismantas/Desktop/Public/website-templates/storage/modulus-3333-proof.png', fullPage: true });
    const page2 = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    await page2.goto('http://127.0.0.1:8124/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page2.waitForTimeout(1500);
    out.metrics8124 = await page2.evaluate(() => ({
      heroText: document.querySelector('.dvele-hero h1')?.textContent?.trim() || null,
      sectionCount: document.querySelectorAll('section').length,
      hasDesign: !!document.querySelector('#design'),
      hasProcess: !!document.querySelector('#process'),
    }));
    await page2.screenshot({ path: 'C:/Users/Vismantas/Desktop/Public/website-templates/storage/modulus-8124-proof.png', fullPage: true });
  } catch (e) { out.errors.push(String(e)); }
  await browser.close();
  console.log(JSON.stringify(out, null, 2));
})();
