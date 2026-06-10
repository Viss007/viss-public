/**
 * GPT-4o vision extraction for VAT invoices (Lithuanian or English layouts)
 * rendered client-side as PNG page images.
 */
import { invoiceLog, approxBase64Bytes, truncate } from './processLogger.mjs';

export const VISION_JSON_SCHEMA = `{
  "data": "",
  "saskaitos_nr": "",
  "pardavejas": "",
  "pirkejas": "",
  "suma_be_pvm": "",
  "pvm_suma": "",
  "suma_su_pvm": "",
  "pastaba": ""
}`;

const SYSTEM_PROMPT = `You are a precise data extraction machine. Your only job is to read exactly what is written on this invoice image (language may be Lithuanian or English). Do not interpret, do not correct spelling, do not add or remove anything.

Return ONLY valid JSON. No explanations.

Rules:
- Copy names exactly as printed. Do not fix spelling. Do not make them "proper".
- Invoice number must contain only letters and numbers. Remove all labels like Nr., SF, TA Nr., Sąskaita, etc.
- Never put any extra text in any field.
- For amounts, never include currency symbols.

{
  "data": "YYYY-MM-DD",
  "saskaitos_nr": "only the number/series, nothing else",
  "pardavejas": "copy seller name exactly as printed, no address",
  "pirkejas": "copy buyer name exactly as printed, no address",
  "suma_be_pvm": "number only with dot as decimal",
  "pvm_suma": "number only with dot as decimal. Use 0 if no VAT",
  "suma_su_pvm": "number only with dot as decimal",
  "pastaba": ""
}

If multiple page images are provided, they are consecutive pages of this one invoice only — read them as one document; do not copy values from other files or requests.`;

/**
 * Strip common invoice labels from the start (repeat until stable).
 * Does not strip a glued series prefix like TA007… (only labels such as TA Nr.).
 * @param {string} nr
 */
function cleanSaskaitosNr(nr) {
  if (nr == null || nr === '') return '';

  let cleaned = String(nr).trim();

  const prefixes = [
    /^TST\.?\s*Nr\.?\s*/i,
    /^TA\.?\s*Nr\.?\s*[:#\-]?\s*/i,
    /^SF\s*:?\s*/i,
    /^Nr\.?\s*[:\-]?\s*/i,
    /^Sąskaita\s*(Nr\.?|Nr)?\s*[:\-]?\s*/i,
  ];

  for (let pass = 0; pass < 10; pass++) {
    const before = cleaned;
    for (const prefix of prefixes) {
      cleaned = cleaned.replace(prefix, '');
    }
    cleaned = cleaned.trim();
    if (cleaned === before) break;
  }

  return cleaned;
}

/**
 * Trim, collapse spaces, strip only balanced outer quote pairs (ASCII + Lithuanian).
 * Does not strip a trailing quote when the string starts with a letter (e.g. UAB "D&G …").
 * @param {string} s
 */
function cleanNameField(s) {
  let name = String(s).trim().replace(/\s+/g, ' ');
  if (!name) return '';
  const startsQuote = /^["„«»']/u;
  const endsQuote = /["„«»']$/u;
  while (name.length >= 2 && startsQuote.test(name) && endsQuote.test(name)) {
    const inner = name.slice(1, -1).trim().replace(/\s+/g, ' ');
    if (inner === name) break;
    name = inner;
  }
  return name;
}

/**
 * Strip currency symbols and whitespace; keep digits and one decimal dot.
 * @param {string} s
 */
function cleanAmountField(s) {
  if (s == null || s === '') return '';
  let t = String(s).replace(/[€$£\s]/g, '').trim();
  const commaCount = (t.match(/,/g) || []).length;
  const dotCount = (t.match(/\./g) || []).length;
  if (commaCount === 1 && dotCount === 0) t = t.replace(',', '.');
  else if (commaCount > 0 && dotCount > 0) t = t.replace(/,/g, '');
  return t;
}

/**
 * Post-process model JSON: invoice id, names, amounts.
 * @param {Record<string, string>} data
 */
export function cleanExtractedData(data) {
  const cleaned = { ...data };

  if (cleaned.saskaitos_nr) {
    cleaned.saskaitos_nr = cleanSaskaitosNr(cleaned.saskaitos_nr);
  }

  if (cleaned.pardavejas) {
    cleaned.pardavejas = cleanNameField(cleaned.pardavejas);
  }
  if (cleaned.pirkejas) {
    cleaned.pirkejas = cleanNameField(cleaned.pirkejas);
  }

  for (const key of ['suma_be_pvm', 'pvm_suma', 'suma_su_pvm']) {
    if (cleaned[key] != null && cleaned[key] !== '') {
      cleaned[key] = cleanAmountField(String(cleaned[key]));
    }
  }

  return cleaned;
}

/**
 * @param {import('openai').default} client
 * @param {string[]} base64PngPages - raw base64 (no data URL) or with data URL prefix (strip externally)
 * @param {string} originalFilename
 * @param {{ reqId?: string }} [ctx]
 */
export async function extractInvoiceWithVision(client, base64PngPages, originalFilename, ctx = {}) {
  const reqId = ctx.reqId ?? '-';
  const model = process.env.OPENAI_VISION_MODEL || 'gpt-4o';
  const maxTokens = Number(process.env.OPENAI_VISION_MAX_TOKENS) || 2000;
  const approxBytes = base64PngPages.reduce((a, b) => a + approxBase64Bytes(b), 0);

  invoiceLog('vision', `[${reqId}] OpenAI request`, {
    file: originalFilename,
    model,
    max_tokens: maxTokens,
    pages: base64PngPages.length,
    approxImageBytes: approxBytes,
  });

  const userText = `Extract invoice data from the page image(s) below. PDF file name: "${originalFilename}". Pages are in reading order and belong to this single invoice only.

Do not reuse values from other files or from earlier requests. Read only what is visible on these images.

Return a single JSON object with exactly these keys (and no others):
${VISION_JSON_SCHEMA}`;

  const content = [
    { type: 'text', text: userText },
    ...base64PngPages.map((b64) => ({
      type: 'image_url',
      image_url: {
        url: `data:image/png;base64,${b64}`,
        detail: 'high',
      },
    })),
  ];

  const t0 = Date.now();
  let res;
  try {
    res = await client.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content },
      ],
    });
  } catch (e) {
    invoiceLog('error', `[${reqId}] OpenAI API throw`, {
      file: originalFilename,
      name: e?.name,
      message: e?.message,
      status: e?.status,
      code: e?.code,
    });
    throw e;
  }

  const ms = Date.now() - t0;
  const usage = res.usage;
  const choice = res.choices[0];
  const raw = choice?.message?.content;

  invoiceLog('vision', `[${reqId}] OpenAI response`, {
    file: originalFilename,
    ms,
    model: res.model,
    id: res.id,
    usage,
    finish_reason: choice?.finish_reason,
    contentLength: raw ? raw.length : 0,
    contentPreview: raw ? truncate(raw, 240) : null,
  });

  if (!raw) {
    throw new Error('No response from model. Try again.');
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (parseErr) {
    invoiceLog('error', `[${reqId}] JSON parse failed`, {
      file: originalFilename,
      preview: truncate(raw, 400),
      parseMessage: parseErr?.message,
    });
    throw new Error('Could not process invoice. Try again.');
  }

  const keys = [
    'data',
    'saskaitos_nr',
    'pardavejas',
    'pirkejas',
    'suma_be_pvm',
    'pvm_suma',
    'suma_su_pvm',
    'pastaba',
  ];
  const out = {};
  for (const k of keys) {
    out[k] = parsed[k] != null ? String(parsed[k]).trim() : '';
  }
  if (out.pastaba.length > 80) {
    out.pastaba = out.pastaba.slice(0, 80);
  }

  const finalOut = cleanExtractedData(out);

  invoiceLog('vision', `[${reqId}] extracted fields`, {
    file: originalFilename,
    data: finalOut.data,
    saskaitos_nr: truncate(finalOut.saskaitos_nr, 80),
    suma_su_pvm: finalOut.suma_su_pvm,
    pardavejas: truncate(finalOut.pardavejas, 60),
    pirkejas: truncate(finalOut.pirkejas, 60),
  });

  return finalOut;
}
