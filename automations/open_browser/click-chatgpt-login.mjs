/**
 * Zero npm deps: CDP — opens ChatGPT auth when needed, then clicks "Continue with Google".
 */
const port = process.env.BRAVE_CDP_PORT || '9333';
const ms = Number(process.env.BRAVE_LOGIN_CLICK_MS || '40000');
const base = `http://127.0.0.1:${port}`;
const deadline = Date.now() + ms;

const clickExpr = `(() => {
  const visible = (el) => {
    if (!el || !(el instanceof Element)) return false;
    const st = window.getComputedStyle(el);
    if (st.visibility === 'hidden' || st.display === 'none') return false;
    const r = el.getBoundingClientRect();
    return r.width > 2 && r.height > 2;
  };
  const norm = (s) => (s || '').replace(/\\s+/g, ' ').trim();

  const roots = [];
  const dlg = document.querySelector('[role="dialog"]');
  if (dlg) roots.push(dlg);
  roots.push(document.body);

  for (const root of roots) {
    const clickables = Array.from(root.querySelectorAll('button, [role="button"], a'));
    for (const el of clickables) {
      const t = norm(el.textContent);
      const al = norm(el.getAttribute('aria-label'));
      const blob = t + ' ' + al;
      if (/continue\\s+with\\s+google/i.test(blob)) {
        if (visible(el)) {
          el.click();
          return 'google:' + (t || al).slice(0, 80);
        }
      }
    }
  }

  const selectors = [
    'a[href*="auth.openai.com"]',
    'a[href*="chatgpt.com/auth"]',
    'a[href*="/login"]',
    '[data-testid="login-button"]',
    '[data-testid="login"]',
    'button[data-testid="login-button"]',
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (visible(el)) {
      el.click();
      return 'login:selector:' + sel;
    }
  }
  const nodes = Array.from(document.querySelectorAll('button, a[role="button"], a'));
  for (const el of nodes) {
    const t = norm(el.textContent);
    if (!t) continue;
    if (/^log\\s*in$/i.test(t) || /^sign\\s*in$/i.test(t)) {
      if (visible(el)) {
        el.click();
        return 'login:text:' + t;
      }
    }
  }
  return '';
})()`;

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function fetchJsonList() {
  const res = await fetch(`${base}/json/list`);
  if (!res.ok) throw new Error(`json/list ${res.status}`);
  return res.json();
}

function pickTarget(list) {
  const pages = list.filter((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  const scored = pages.map((t) => {
    const u = t.url || '';
    let score = 0;
    if (/chatgpt\.com/i.test(u)) score += 3;
    if (/auth\.openai\.com/i.test(u)) score += 2;
    return { t, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.t ?? pages[0];
}

function attachCdp(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const pending = new Map();
    let nextId = 1;

    ws.addEventListener('open', () => resolve({ ws, send }));

    ws.addEventListener('error', (e) => reject(e.error ?? new Error('WebSocket error')));

    ws.addEventListener('message', (ev) => {
      let msg;
      try {
        msg = JSON.parse(String(ev.data));
      } catch {
        return;
      }
      if (msg.id != null && pending.has(msg.id)) {
        const { resolve: res, reject: rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(msg.error.message || JSON.stringify(msg.error)));
        else res(msg.result);
      }
    });

    function send(method, params = {}) {
      const id = nextId++;
      ws.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
      });
    }
  });
}

async function waitForTargets() {
  while (Date.now() < deadline) {
    try {
      const list = await fetchJsonList();
      const target = pickTarget(list);
      if (target?.webSocketDebuggerUrl) return target;
    } catch {
      /* Brave still starting */
    }
    await sleep(400);
  }
  console.error(`No CDP page target at ${base}/json/list`);
  process.exit(4);
}

const target = await waitForTargets();
const { ws, send } = await attachCdp(target.webSocketDebuggerUrl);

try {
  await send('Runtime.enable', {});

  while (Date.now() < deadline) {
    const result = await send('Runtime.evaluate', {
      expression: clickExpr,
      returnByValue: true,
      awaitPromise: false,
    });
    if (result?.exceptionDetails) {
      await sleep(450);
      continue;
    }
    const val = result?.result?.value;
    if (typeof val === 'string' && val.startsWith('google:')) {
      console.log('Clicked:', val);
      process.exit(0);
    }
    if (typeof val === 'string' && val.startsWith('login:')) {
      await sleep(650);
      continue;
    }
    await sleep(450);
  }
  console.error('Continue with Google not found before timeout');
  process.exit(3);
} finally {
  try {
    ws.close();
  } catch {
    /* ignore */
  }
}
