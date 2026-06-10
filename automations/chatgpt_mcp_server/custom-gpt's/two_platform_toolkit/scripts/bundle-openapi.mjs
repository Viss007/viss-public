/**
 * Merges openapi/toolkit.oauth.openapi.yaml + openapi/toolkit.tools.openapi.yaml
 * into openapi/toolkit.openapi.yaml for Custom GPT single-schema import.
 *
 * Default: **servers** come from the OAuth YAML (placeholder **https://example.com**). Safe to commit.
 * Paste-ready host: **`npm run openapi:bundle:paste`** (loads **TOOLKIT_PUBLIC_URL** from `.env`; works on Windows).
 * Or: `OPENAPI_BUNDLE_USE_DOTENV_PUBLIC_URL=1 npm run openapi:bundle`
 */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const openapiDir = path.join(projectRoot, 'openapi');

const usePaste = process.argv.includes('--paste');
const useDotenvPublicUrl =
  usePaste ||
  process.env.OPENAPI_BUNDLE_USE_DOTENV_PUBLIC_URL === '1' ||
  process.env.OPENAPI_BUNDLE_USE_DOTENV_PUBLIC_URL === 'true';

if (useDotenvPublicUrl) {
  dotenv.config({ path: path.join(projectRoot, '.env') });
}

const oauthPath = path.join(openapiDir, 'toolkit.oauth.openapi.yaml');
const toolsPath = path.join(openapiDir, 'toolkit.tools.openapi.yaml');
const outPath = path.join(openapiDir, 'toolkit.openapi.yaml');

const oauth = YAML.parse(readFileSync(oauthPath, 'utf8'));
const tools = YAML.parse(readFileSync(toolsPath, 'utf8'));

if (oauth.info.version !== tools.info.version) {
  console.error(
    `Version mismatch: oauth ${oauth.info.version} vs tools ${tools.info.version}. Align info.version in both files.`,
  );
  process.exit(1);
}

const tagNames = new Set();
const tags = [];
for (const t of [...(oauth.tags || []), ...(tools.tags || [])]) {
  if (!tagNames.has(t.name)) {
    tagNames.add(t.name);
    tags.push(t);
  }
}

const envPublic = useDotenvPublicUrl
  ? process.env.TOOLKIT_PUBLIC_URL?.trim().replace(/\/+$/, '')
  : '';
const servers = envPublic
  ? [
    {
      url: envPublic,
      description:
        'From TOOLKIT_PUBLIC_URL (npm run openapi:bundle:paste or OPENAPI_BUNDLE_USE_DOTENV_PUBLIC_URL=1). Must match server .env.',
    },
  ]
  : oauth.servers;

if (useDotenvPublicUrl && !envPublic) {
  console.warn(
    'TOOLKIT_PUBLIC_URL missing in .env — using placeholder servers (https://example.com).',
  );
} else if (envPublic) {
  console.log(`servers[0].url = ${envPublic}`);
}

const merged = {
  openapi: oauth.openapi,
  info: {
    title: 'LeadFlow toolkit - Composio-aligned tools (your backend)',
    version: oauth.info.version,
    description: [
      oauth.info.description.trimEnd(),
      '',
      '---',
      '',
      '**Bundled spec** (single GPT import): combines OAuth + tools from **`toolkit.oauth.openapi.yaml`** and **`toolkit.tools.openapi.yaml`**. Edit those files, then `npm run openapi:bundle`. **ChatGPT:** register this toolkit’s public origin on **one** Custom GPT only (duplicate domain across Action sets is rejected).',
      '',
      tools.info.description.trim(),
    ].join('\n'),
  },
  servers,
  tags,
  paths: { ...oauth.paths, ...tools.paths },
  components: {
    securitySchemes: { ...oauth.components.securitySchemes },
    schemas: {
      ...oauth.components.schemas,
      ...tools.components.schemas,
    },
  },
};

writeFileSync(outPath, YAML.stringify(merged, { lineWidth: 0, singleQuote: false }));
console.log(`Wrote ${path.relative(process.cwd(), outPath)}`);
