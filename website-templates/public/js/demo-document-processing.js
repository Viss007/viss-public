(function () {
  const ta = document.getElementById("demo-doc-input");
  const btn = document.getElementById("demo-doc-extract");
  const out = document.getElementById("demo-doc-result");

  const SAMPLE = `INVOICE INV-2024-0891
Acme Tools UAB
Vilnius, Lithuania

Date: 15/03/2024
Due: 29/03/2024

Bill to: Widget Studio LLC

Description                    Qty     Unit      Line total
Implementation — phase 1        40    €120.00    €4,800.00
Support retainer (March)         1  €1,200.00    €1,200.00

Subtotal:                                   €6,000.00
VAT 21%:                                    €1,260.00
TOTAL DUE (EUR):                            €7,260.00

Payment ref: please use invoice number in the transfer note.`;

  function parseAmount(str) {
    if (!str) return null;
    const n = parseFloat(String(str).replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  }

  function extractFields(text) {
    const raw = text.replace(/\r\n/g, "\n");
    const lines = raw
      .split("\n")
      .map(function (l) {
        return l.trim();
      })
      .filter(Boolean);

    let invoiceNumber = "";
    const firstLine = lines[0] || "";
    const invHead = firstLine.match(/^invoice\s+([A-Z0-9][A-Z0-9\-\/]*)$/i);
    if (invHead) invoiceNumber = invHead[1].trim();
    if (!invoiceNumber) {
      const invLine = raw.match(/invoice\s*(?:no\.?|number|#)?\s*[:#]?\s*([A-Z0-9][A-Z0-9\-\/]*)/i);
      if (invLine) invoiceNumber = invLine[1].trim();
    }
    if (!invoiceNumber) {
      const hash = raw.match(/\b(INV[\-#]?[A-Z0-9\-]+)/i);
      if (hash) invoiceNumber = hash[1].trim();
    }

    let date = "";
    const dm = raw.match(/\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\b/);
    if (dm) date = dm[1];

    let amountStr = "";
    let currency = "";
    const totalRe =
      /(?:total\s*due|amount\s*due|balance\s*due|grand\s*total|total)[:\s]*(?:\(?([A-Z]{3})\)?\s*)?(?:[€$£]\s*)?([\d,]+\.?\d*)/gi;
    let tm;
    let bestVal = -1;
    while ((tm = totalRe.exec(raw)) !== null) {
      const cur = tm[1];
      const num = parseAmount(tm[2]);
      if (num != null && num >= bestVal) {
        bestVal = num;
        amountStr = tm[2];
        currency = cur || "";
      }
    }
    const euroAll = raw.matchAll(/€\s*([\d,]+\.?\d*)/g);
    for (const em of euroAll) {
      const num = parseAmount(em[1]);
      if (num != null && num > bestVal) {
        bestVal = num;
        amountStr = em[1];
        currency = "EUR";
      }
    }
    const usdAll = raw.matchAll(/\$\s*([\d,]+\.?\d*)/g);
    for (const um of usdAll) {
      const num = parseAmount(um[1]);
      if (num != null && num > bestVal) {
        bestVal = num;
        amountStr = um[1];
        currency = "USD";
      }
    }
    if (!currency && (raw.includes("€") || /\bEUR\b/i.test(raw))) currency = "EUR";
    if (!currency && raw.includes("$")) currency = "USD";

    let vendor = "";
    const fromM = raw.match(/(?:from|vendor|supplier|bill from)[:\s]+([^\n]+)/i);
    if (fromM) vendor = fromM[1].trim();
    else if (lines.length >= 2) {
      const skip = /^(invoice|inv[-#]?|bill to|date|due)/i;
      for (let i = 0; i < Math.min(lines.length, 6); i++) {
        const L = lines[i];
        if (skip.test(L) || L.length < 2) continue;
        if (/^bill\s+to:/i.test(L)) continue;
        if (/^\d{1,2}[\/\-.]/.test(L)) continue;
        vendor = L;
        break;
      }
    }

    const amountNum = parseAmount(amountStr);
    const unusual = amountNum != null && amountNum > 10000;

    return {
      vendor: vendor || "—",
      invoiceNumber: invoiceNumber || "—",
      date: date || "—",
      amount: amountStr || "—",
      currency: currency || "—",
      unusual: unusual,
    };
  }

  function renderRow(label, value, extra) {
    return (
      "<tr><th>" +
      label +
      "</th><td>" +
      value +
      (extra || "") +
      "</td></tr>"
    );
  }

  function runExtract() {
    if (!out || !ta) return;
    const f = extractFields(ta.value || "");
    let flag = "";
    if (f.unusual) {
      flag = ' <span class="demo-doc__flag" title="Rule-based flag">Review</span>';
    }
    out.innerHTML =
      '<div class="demo-doc__result"><h3>Extracted fields</h3><div class="demo-doc__table-wrap"><table class="demo-doc__table">' +
      renderRow("Vendor / from", escapeHtml(f.vendor)) +
      renderRow("Invoice #", escapeHtml(f.invoiceNumber)) +
      renderRow("Date", escapeHtml(f.date)) +
      renderRow("Total / amount due", escapeHtml(f.amount) + (f.currency && f.currency !== "—" ? " " + escapeHtml(f.currency) : ""), flag) +
      "</table></div></div>";
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  if (ta && !ta.value.trim()) {
    ta.value = SAMPLE;
  }

  btn?.addEventListener("click", runExtract);
  runExtract();
})();
