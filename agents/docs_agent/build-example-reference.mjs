/**
 * Writes converted/example/saskaitos-etalonas.xlsx using the same layout as /api/export.
 * Run: npm run example:excel
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildInvoiceExcelBuffer } from './lib/excelExport.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'converted', 'example');
const outFile = path.join(outDir, 'saskaitos-etalonas.xlsx');

const rows = [
  {
    failas: 'pavyzdys_saskaita_1.pdf',
    data: '2012-03-30',
    saskaitosNumeris: 'TST 00100',
    pardavejas: 'J.Bazyk individuali įmonė',
    pirkejas: 'UAB STEEL.LT',
    sumaBePvm: '1680',
    pvmSuma: '352.8',
    sumaSuPvm: '2032.8',
    pastaba: '',
  },
  {
    failas: 'pavyzdys_saskaita_2.pdf',
    data: '2012-03-23',
    saskaitosNumeris: 'TST 00100',
    pardavejas: 'J.Bazyk individuali įmonė',
    pirkejas: 'UAB STEEL.LT',
    sumaBePvm: '1850',
    pvmSuma: '388.5',
    sumaSuPvm: '2238.5',
    pastaba: 'Išankstinė sąskaita',
  },
  {
    failas: 'pavyzdys_trecia_saskaita.pdf',
    data: '2024-11-15',
    saskaitosNumeris: 'SF 2024/089',
    pardavejas: 'UAB Pavyzdys LT',
    pirkejas: 'MB Klientas',
    sumaBePvm: '1000',
    pvmSuma: '210',
    sumaSuPvm: '1210',
    pastaba: 'Apmokėti per 14 d.',
  },
];

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const buf = await buildInvoiceExcelBuffer(rows);
  fs.writeFileSync(outFile, buf);
  console.log(`Wrote ${outFile} (${rows.length} data rows + header)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
