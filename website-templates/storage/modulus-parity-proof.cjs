const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const out = { errors: [], checks: {} };
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  try {
    await page.goto('http://127.0.0.1:3333/websites/modulus', { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForSelector('.tpl-modulus', { timeout: 15000 });

    const links = await page.evaluate(() => {
      const booking = document.querySelector('.mod-contact-hero__booking-btn');
      const about = document.querySelector('.dvele-nav__links a:nth-child(2)');
      const reach = [...document.querySelectorAll('.dvele-nav__links a')].find((a) => /reach out/i.test(a.textContent || ''));
      return {
        bookingHref: booking?.getAttribute('href') || null,
        aboutHref: about?.getAttribute('href') || null,
        reachHref: reach?.getAttribute('href') || null,
        loginUrl: document.querySelector('form[data-auth-form="login"]')?.getAttribute('data-login-url') || null,
      };
    });
    out.checks.links = links;

    const bookingPage = await browser.newPage();
    await bookingPage.goto(links.bookingHref, { waitUntil: 'domcontentloaded', timeout: 20000 });
    out.checks.bookingLanded = bookingPage.url();
    await bookingPage.close();

    await page.getByRole('button', { name: /^Login$/i }).click();
    await page.waitForSelector('#dvele-auth-lightbox:not([hidden])', { timeout: 5000 });
    await Promise.all([
      page.waitForURL(/127\.0\.0\.1:8124\/admin-hub/, { timeout: 45000 }),
      page.locator('#dvele-auth-panel-login button[type="submit"]').click(),
    ]);
    out.checks.adminUrl = page.url();

    const page2 = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    await page2.goto('http://127.0.0.1:3333/websites/modulus', { waitUntil: 'networkidle', timeout: 45000 });
    await page2.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.45));
    await page2.waitForTimeout(800);
    out.checks.reveal = await page2.evaluate(() => {
      const benefit = document.querySelector('#care .dvele-benefit');
      const stat = document.querySelector('section.dvele-stat');
      return {
        benefitInview: benefit?.classList.contains('dvele-inview') || false,
        statInview: stat?.classList.contains('dvele-inview') || false,
        benefitOpacity: benefit ? getComputedStyle(benefit.querySelector('.dvele-display-h') || benefit).opacity : null,
      };
    });
    await page2.close();
  } catch (e) {
    out.errors.push(String(e));
  }

  await browser.close();
  console.log(JSON.stringify(out, null, 2));
  process.exit(out.errors.length ? 1 : 0);
})();
