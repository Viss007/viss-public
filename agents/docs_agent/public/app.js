/** Browser-side trace (F12 console). Server logs: logs/invoices-app.log */
function invLog(...args) {
  if (typeof console !== 'undefined' && console.log) {
    console.log('[invoices]', new Date().toISOString(), ...args);
  }
}

/** Resolve API/static paths when mounted at /agents/docs-agent on :3333 gateway. */
function appUrl(relativePath) {
  return new URL(String(relativePath).replace(/^\//, ''), window.location.href).href;
}

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const fileListSection = document.getElementById('file-list-section');
const fileListPanel = document.getElementById('file-list-panel');
const fileList = document.getElementById('file-list');
const fileCount = document.getElementById('file-count');
const fileListToggle = document.getElementById('file-list-toggle');
const fileListToggleIcon = document.getElementById('file-list-toggle-icon');
const btnConvert = document.getElementById('btn-convert');
const progressWrap = document.getElementById('progress-wrap');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const alertError = document.getElementById('alert-error');
const resultsSection = document.getElementById('results-section');
const previewBody = document.getElementById('preview-body');
const btnDownload = document.getElementById('btn-download');
const btnProcessAgain = document.getElementById('btn-process-again');
const reviewMeta = document.getElementById('review-meta');
const sampleInvoiceBtns = document.querySelectorAll('.sample-invoice-btn');

/** @type {File[]} */
let selectedFiles = [];
/** File list UI: collapsed by default so „Apdoroti“ stays in view. */
let fileListExpanded = false;
/** @type {object[]} */
let lastRows = [];

/** @type {{ maxPagesPerFile: number, maxFiles: number }} */
let serverConfig = { maxPagesPerFile: 12, maxFiles: 25 };

/**
 * Column keys matching /api/export (backend unchanged).
 * multiline: textarea + wrap — avoids single-line input clipping long text.
 */
const TABLE_COLUMNS = [
  { key: 'failas', label: 'File', highlight: false, multiline: true },
  { key: 'data', label: 'Date', highlight: true, multiline: false },
  { key: 'saskaitosNumeris', label: 'Invoice no.', highlight: true, multiline: false },
  { key: 'pardavejas', label: 'Seller', highlight: false, multiline: true },
  { key: 'pirkejas', label: 'Buyer', highlight: false, multiline: true },
  { key: 'sumaBePvm', label: 'ex. VAT', highlight: false, multiline: false },
  { key: 'pvmSuma', label: 'VAT', highlight: false, multiline: false },
  { key: 'sumaSuPvm', label: 'incl. VAT', highlight: true, multiline: false },
  { key: 'pastaba', label: 'Notes', highlight: false, multiline: true },
];

/** Grow textarea to content (caps height via CSS max-height). */
function sizeTextareaToContent(el) {
  if (!el || el.tagName !== 'TEXTAREA') return;
  el.style.height = 'auto';
  const next = Math.min(Math.max(el.scrollHeight, 44), 192);
  el.style.height = `${next}px`;
}

async function loadConfig() {
  try {
    const r = await fetch(appUrl('api/config'));
    if (!r.ok) return;
    const j = await r.json();
    if (typeof j.maxPagesPerFile === 'number') serverConfig.maxPagesPerFile = j.maxPagesPerFile;
    if (typeof j.maxFiles === 'number') serverConfig.maxFiles = j.maxFiles;
  } catch {
    /* defaults */
  }
}

loadConfig();

function showError(msg) {
  alertError.textContent = msg;
  alertError.classList.remove('hidden');
}

function hideError() {
  alertError.classList.add('hidden');
}

function setSampleButtonsDisabled(disabled) {
  sampleInvoiceBtns.forEach((b) => {
    b.disabled = disabled;
  });
}

function formatSize(n) {
  const dec = (x) => String(x).replace('.', ',');
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${dec((n / 1024).toFixed(1))} KB`;
  return `${dec((n / (1024 * 1024)).toFixed(1))} MB`;
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;').replace(/\s+/g, ' ').trim();
}

/** @type {any} */
let pdfjsLib = null;

async function ensurePdfJs() {
  if (pdfjsLib) return pdfjsLib;
  const libUrl = appUrl('pdfjs/pdf.mjs');
  const workerUrl = appUrl('pdfjs/pdf.worker.mjs');
  invLog('pdf: same-origin import', libUrl);
  pdfjsLib = await import(libUrl);
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfjsLib;
}

/** Render scale for PNGs sent to extraction (higher = sharper text, larger payload). */
const PDF_RENDER_SCALE = 2.5;

/**
 * Paths must match server.mjs static mounts so getDocument() never blocks on third-party CDNs.
 * @param {ArrayBuffer} buf
 */
function pdfGetDocumentOptions(buf) {
  const o = appUrl('');
  return {
    data: buf,
    cMapUrl: appUrl('pdfjs-assets/cmaps/'),
    cMapPacked: true,
    standardFontDataUrl: appUrl('pdfjs-assets/standard_fonts/'),
  };
}

/**
 * @param {ArrayBuffer} buf
 * @param {number} maxPages
 * @param {(current: number, rendering: number, totalInPdf: number) => void} [onPage]
 */
async function pdfBufferToBase64Pages(buf, maxPages, onPage) {
  invLog('pdf: loading pdf.js');
  const pdfjs = await ensurePdfJs();
  invLog('pdf: getDocument');
  const pdf = await pdfjs.getDocument(pdfGetDocumentOptions(buf)).promise;
  const totalInPdf = pdf.numPages;
  invLog('pdf: numPages', totalInPdf);
  const n = Math.min(totalInPdf, maxPages);
  const pages = [];
  for (let p = 1; p <= n; p += 1) {
    onPage?.(p, n, totalInPdf);
    invLog('pdf: render page', p, '/', n);
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Your browser does not support this feature.');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const renderTask = page.render({ canvasContext: ctx, viewport });
    await renderTask.promise;
    await new Promise((r) => requestAnimationFrame(r));
    const dataUrl = canvas.toDataURL('image/png');
    const b64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    pages.push(b64);
  }
  return { pages, pageCount: totalInPdf, truncated: totalInPdf > maxPages };
}

async function pdfFileToBase64Pages(file, maxPages, onPage) {
  const buf = await file.arrayBuffer();
  return pdfBufferToBase64Pages(buf, maxPages, onPage);
}

async function renderPdfThumb(file) {
  try {
    const pdfjs = await ensurePdfJs();
    const buf = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument(pdfGetDocumentOptions(buf)).promise;
    const page = await pdf.getPage(1);
    const scale = 0.35;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const renderTask = page.render({ canvasContext: ctx, viewport });
    await renderTask.promise;
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

function updateFileUI() {
  fileList.innerHTML = '';
  selectedFiles.forEach((file, i) => {
    const li = document.createElement('li');
    li.className =
      'flex items-stretch gap-3 rounded-xl border border-slate-200 bg-white overflow-hidden';
    li.dataset.index = String(i);

    const thumbWrap = document.createElement('div');
    thumbWrap.className =
      'w-20 shrink-0 bg-slate-100 flex items-center justify-center min-h-[72px]';
    thumbWrap.innerHTML =
      '<span class="text-[10px] text-slate-400 px-1 text-center">…</span>';
    li.appendChild(thumbWrap);

    const meta = document.createElement('div');
    meta.className = 'flex flex-1 items-center justify-between gap-3 py-3 pr-3 min-w-0';
    meta.innerHTML = `
      <div class="min-w-0">
        <p class="truncate text-slate-800 font-medium text-sm" title="${escapeAttr(file.name)}">${escapeHtml(file.name)}</p>
        <p class="text-xs text-slate-400">${formatSize(file.size)}</p>
      </div>
      <button type="button" data-i="${i}" class="remove-btn text-red-600 hover:text-red-800 font-medium text-sm shrink-0">Remove</button>
    `;
    li.appendChild(meta);

    fileList.appendChild(li);

    renderPdfThumb(file).then((dataUrl) => {
      if (dataUrl) {
        thumbWrap.innerHTML = `<img src="${dataUrl}" alt="" class="w-full h-full object-cover object-top max-h-[88px]" />`;
      } else {
        thumbWrap.innerHTML =
          '<span class="text-[10px] text-slate-400 px-1">PDF</span>';
      }
    });
  });

  fileList.querySelectorAll('.remove-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-i'));
      selectedFiles.splice(idx, 1);
      updateFileUI();
    });
  });

  fileCount.textContent = `${selectedFiles.length} file(s)`;
  fileListSection.classList.toggle('hidden', selectedFiles.length === 0);
  btnConvert.disabled = selectedFiles.length === 0;

  if (selectedFiles.length === 0) {
    fileListExpanded = false;
  }
  applyFileListCollapseState();
}

function applyFileListCollapseState() {
  const open = fileListExpanded && selectedFiles.length > 0;
  fileListPanel.classList.toggle('hidden', !open);
  fileListToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (fileListToggleIcon) {
    fileListToggleIcon.classList.toggle('rotate-180', open);
  }
}

fileListToggle.addEventListener('click', () => {
  if (selectedFiles.length === 0) return;
  fileListExpanded = !fileListExpanded;
  applyFileListCollapseState();
});

function addFiles(newFiles) {
  const pdfs = Array.from(newFiles).filter(
    (f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name),
  );
  if (!pdfs.length) {
    showError('Please choose PDF files.');
    return;
  }
  hideError();
  const names = new Set(selectedFiles.map((f) => f.name + f.size));
  const cap = serverConfig.maxFiles || 25;
  for (const f of pdfs) {
    if (selectedFiles.length >= cap) break;
    const key = f.name + f.size;
    if (!names.has(key)) {
      names.add(key);
      selectedFiles.push(f);
    }
  }
  resultsSection.classList.add('hidden');
  lastRows = [];
  previewBody.innerHTML = '';
  if (reviewMeta) reviewMeta.textContent = '';
  updateFileUI();
}

dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});

fileInput.addEventListener('change', () => {
  if (fileInput.files?.length) addFiles(fileInput.files);
  fileInput.value = '';
});

['dragenter', 'dragover'].forEach((ev) => {
  dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add('drop-active');
  });
});
['dragleave', 'drop'].forEach((ev) => {
  dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('drop-active');
  });
});
dropzone.addEventListener('drop', (e) => {
  const dt = e.dataTransfer;
  if (dt?.files?.length) addFiles(dt.files);
});

/** @param {string} [text] — omit or empty = progress bar only (hides #progress-text). */
function setProgress(pct, text) {
  progressBar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  progressBar.classList.remove('animate-pulse-slow');
  if (text === undefined || text === '') {
    progressText.textContent = '';
    progressText.classList.add('hidden');
  } else {
    progressText.textContent = text;
    progressText.classList.remove('hidden');
  }
}

/**
 * Editable review table: syncs inputs to lastRows[i][key].
 * @param {object[]} rows
 */
function renderReviewTable(rows) {
  previewBody.innerHTML = '';
  if (reviewMeta) {
    const n = rows.length;
    const ok = rows.filter((r) => !r._error).length;
    const bad = n - ok;
    reviewMeta.textContent =
      bad > 0
        ? `${n} rows · ${ok} OK · ${bad} with warning or error`
        : `${n} rows · all OK`;
  }

  rows.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    const hasErr = Boolean(row._error);
    tr.className = hasErr
      ? 'bg-red-50/90 border-l-4 border-l-red-400'
      : 'odd:bg-slate-50/40 hover:bg-brand-50/30 transition-colors';

    const errNote = hasErr ? `Error: ${row._error}` : '';
    const pastabaVal = [row.pastaba, errNote].filter(Boolean).join(' — ');
    row.pastaba = pastabaVal;

    for (const col of TABLE_COLUMNS) {
      const td = document.createElement('td');
      const hl = col.highlight ? 'inv-col-highlight' : '';
      td.className = `px-2 py-2 align-middle ${hl} border-b border-slate-100`;

      const raw = row[col.key];
      const val = raw == null || raw === '' ? '' : String(raw);

      /** @type {HTMLInputElement | HTMLTextAreaElement} */
      let control;
      if (col.multiline) {
        const ta = document.createElement('textarea');
        ta.rows = 2;
        ta.className = 'inv-cell-input inv-cell-textarea';
        ta.value = val;
        ta.setAttribute('data-row', String(rowIndex));
        ta.setAttribute('data-key', col.key);
        ta.setAttribute('aria-label', `${col.label}, row ${rowIndex + 1}`);
        ta.setAttribute('spellcheck', 'false');
        if (hasErr && col.key !== 'pastaba') {
          ta.classList.add('opacity-90');
        }
        control = ta;
      } else {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'inv-cell-input';
        input.value = val;
        input.setAttribute('data-row', String(rowIndex));
        input.setAttribute('data-key', col.key);
        input.setAttribute('aria-label', `${col.label}, row ${rowIndex + 1}`);
        if (hasErr && col.key !== 'pastaba') {
          input.classList.add('opacity-90');
        }
        control = input;
      }

      const sync = () => {
        if (!lastRows[rowIndex]) return;
        lastRows[rowIndex][col.key] = control.value;
      };

      control.addEventListener('input', () => {
        sync();
        if (col.multiline) sizeTextareaToContent(control);
      });
      control.addEventListener('change', sync);

      td.appendChild(control);
      if (col.multiline) {
        requestAnimationFrame(() => sizeTextareaToContent(control));
      }
      tr.appendChild(td);
    }

    previewBody.appendChild(tr);
  });
}

async function readNdjsonStream(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let backlog = '';
  const rows = [];
  let pct = 45;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    backlog += decoder.decode(value, { stream: true });
    const parts = backlog.split('\n');
    backlog = parts.pop() ?? '';
    for (const line of parts) {
      const t = line.trim();
      if (!t) continue;
      let msg;
      try {
        msg = JSON.parse(t);
      } catch {
        continue;
      }

      if (msg.event === 'queue') {
        setProgress(45, '');
      } else if (msg.event === 'file_start') {
        pct = 45 + (msg.index / Math.max(1, msg.total)) * 45;
        const tr = msg.truncated ? ` · ${msg.pagesSent} pg` : '';
        setProgress(pct, `${msg.name}${tr}`);
      } else if (msg.event === 'vision') {
        setProgress(Math.min(92, pct + 4), msg.name);
      } else if (msg.event === 'file_done') {
        rows.push(msg.row);
        lastRows = [...rows];
      } else if (msg.event === 'file_error') {
        rows.push(msg.row);
        lastRows = [...rows];
      } else if (msg.event === 'complete') {
        lastRows = msg.rows?.length ? msg.rows : rows;
        setProgress(
          100,
          `Done: ${msg.processed ?? 0} OK, ${msg.failed ?? 0} failed.`,
        );
        return lastRows;
      }
    }
  }
  return rows;
}

async function runInvoiceConversion() {
  await loadConfig();
  const maxPages = serverConfig.maxPagesPerFile || 12;

  const payload = { files: [] };
  const totalFiles = selectedFiles.length;

  for (let fi = 0; fi < totalFiles; fi += 1) {
    const file = selectedFiles[fi];
    const basePct = 4 + (fi / Math.max(1, totalFiles)) * 36;
    setProgress(basePct, file.name);
    invLog('raster start', file.name, file.size);
    const ab = await file.arrayBuffer();
    const { pages, truncated } = await pdfBufferToBase64Pages(
      ab,
      maxPages,
      (current, rendering, totalInPdf) => {
        const sub =
          4 +
          ((fi + current / Math.max(1, rendering)) / Math.max(1, totalFiles)) * 36;
        setProgress(
          sub,
          rendering > 1 ? `${file.name} · ${current}/${rendering}` : file.name,
        );
      },
    );
    if (!pages.length) {
      throw new Error(`Could not render pages: ${file.name}`);
    }
    payload.files.push({ name: file.name, pages });
    if (truncated) {
      /* server also notes truncation */
    }
  }

  setProgress(42, '');

  const bodyStr = JSON.stringify(payload);
  invLog('POST /api/process', {
    files: payload.files.length,
    approxBodyChars: bodyStr.length,
    names: payload.files.map((f) => f.name),
    pagesPerFile: payload.files.map((f) => f.pages?.length ?? 0),
  });

  const res = await fetch(appUrl('api/process'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: bodyStr,
  });
  invLog('response', res.status, res.headers.get('content-type'));

  if (res.status === 503) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Processing is unavailable right now. Try again later.');
  }

  if (res.status === 429) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Your demo attempt limit is used up.');
  }

  if (res.status === 413) {
    throw new Error(
      'Files are too large or have too many pages. Try fewer or shorter documents.',
    );
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status}`);
  }

  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('ndjson')) {
    throw new Error('Something went wrong. Try again later.');
  }

  await readNdjsonStream(res);

  if (!lastRows.length) {
    showError('No rows returned.');
  } else {
    renderReviewTable(lastRows);
    const failed = lastRows.filter((r) => r._error).length;
    if (failed) {
      showError(`${failed} file(s) had errors (see table).`);
    } else {
      hideError();
    }
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

btnConvert.addEventListener('click', async () => {
  hideError();
  resultsSection.classList.add('hidden');
  lastRows = [];
  previewBody.innerHTML = '';
  if (reviewMeta) reviewMeta.textContent = '';

  btnConvert.disabled = true;
  setSampleButtonsDisabled(true);
  progressWrap.classList.remove('hidden');
  progressBar.classList.add('animate-pulse-slow');
  progressBar.style.width = '4%';
  setProgress(4, '');

  try {
    await runInvoiceConversion();
  } catch (e) {
    invLog('convert error', e?.message, e);
    showError(e?.message || 'Unknown error.');
  } finally {
    progressWrap.classList.add('hidden');
    btnConvert.disabled = selectedFiles.length === 0;
    setSampleButtonsDisabled(false);
  }
});

sampleInvoiceBtns.forEach((btn) => {
  btn.addEventListener('click', async () => {
    const basename = btn.getAttribute('data-sample');
    if (!basename) return;

    hideError();
    resultsSection.classList.add('hidden');
    lastRows = [];
    previewBody.innerHTML = '';
    if (reviewMeta) reviewMeta.textContent = '';

    btnConvert.disabled = true;
    setSampleButtonsDisabled(true);
    progressWrap.classList.remove('hidden');
    progressBar.classList.add('animate-pulse-slow');
    progressBar.style.width = '4%';
    setProgress(4, '');

    try {
      const res = await fetch(appUrl(`samples/${encodeURIComponent(basename)}`));
      if (!res.ok) {
        throw new Error('Could not download sample PDF.');
      }
      const blob = await res.blob();
      const file = new File([blob], basename, { type: 'application/pdf' });
      selectedFiles = [file];
      updateFileUI();

      await runInvoiceConversion();
    } catch (e) {
      invLog('sample error', e?.message, e);
      showError(e?.message || 'Could not run sample.');
    } finally {
      progressWrap.classList.add('hidden');
      btnConvert.disabled = selectedFiles.length === 0;
      setSampleButtonsDisabled(false);
    }
  });
});

function collectRowsForExport() {
  return lastRows.map((r) => {
    const { _error, ...rest } = r;
    return rest;
  });
}

btnDownload.addEventListener('click', async () => {
  if (!lastRows.length) return;
  hideError();
  try {
    const exportRows = collectRowsForExport();
    const res = await fetch(appUrl('api/export'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: exportRows }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Export failed');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    showError(e?.message || 'Download failed.');
  }
});

btnProcessAgain.addEventListener('click', () => {
  resultsSection.classList.add('hidden');
  lastRows = [];
  previewBody.innerHTML = '';
  if (reviewMeta) reviewMeta.textContent = '';
  hideError();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

