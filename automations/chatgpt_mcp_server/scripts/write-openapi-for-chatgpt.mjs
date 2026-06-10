/**
 * Writes openapi-for-chatgpt-COPY-PASTE.yaml with servers[0].url set to the live HTTPS origin.
 * Usage: node scripts/write-openapi-for-chatgpt.mjs <https://your-ngrok-host> [source.yaml]
 * Default source: openapi-custom-gpt.yaml (no OAuth). For OAuth use openapi-custom-gpt.oauth.yaml.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const urlArg = process.argv[2];
const srcName = process.argv[3] ?? 'openapi-custom-gpt.yaml';

if (!urlArg) {
  console.error('Usage: node scripts/write-openapi-for-chatgpt.mjs <https://origin> [source-yaml]');
  process.exit(1);
}

let origin = urlArg.trim().replace(/\/$/, '');
if (!/^https:\/\//i.test(origin)) {
  console.error('Origin must start with https:// (use your ngrok https URL)');
  process.exit(1);
}

const src = path.join(root, srcName);
const dest = path.join(root, 'openapi-for-chatgpt-COPY-PASTE.yaml');

if (!fs.existsSync(src)) {
  console.error('Source not found:', src);
  process.exit(1);
}

let text = fs.readFileSync(src, 'utf8');
const replaced = text.replace(/^(\s*-\s*url:\s*)\S+$/m, `$1${origin}`);
if (replaced === text) {
  console.error('Could not find servers list url line (expected "  - url: ...")');
  process.exit(1);
}

let out = replaced;
out = out.replace(
  /\*\*Do not paste this file into ChatGPT as-is\.\*\*\s+Run \*\*`npm run start:tunnel`\*\* from this folder; it writes \*\*`openapi-for-chatgpt-COPY-PASTE\.yaml`\*\* with your live \*\*ngrok HTTPS\*\* origin already filled in\. Open that file, Select All, paste into the Custom GPT \*\*Action\*\* schema\. Set Action \*\*Authentication\*\* to \*\*None\*\* for first tests\./,
  '**Paste this entire file** into the Custom GPT **Action** schema. **servers[0].url** is already set to your tunnel. Set Action **Authentication** to **None** for first tests.',
);

fs.writeFileSync(dest, out, 'utf8');
console.log('Wrote', dest);
