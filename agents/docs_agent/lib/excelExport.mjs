/**
 * Shared Excel export (same layout as HTTP /api/export).
 */
import ExcelJS from 'exceljs';

/**
 * @param {Array<Record<string, string>>} rows
 * @returns {Promise<Buffer>}
 */
export async function buildInvoiceExcelBuffer(rows) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Invoices → Excel';
  const ws = wb.addWorksheet('Invoices', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  ws.columns = [
    { header: 'File', key: 'failas', width: 28 },
    { header: 'Date', key: 'data', width: 14 },
    { header: 'Invoice no.', key: 'saskaitosNumeris', width: 22 },
    { header: 'Seller', key: 'pardavejas', width: 36 },
    { header: 'Buyer', key: 'pirkejas', width: 36 },
    { header: 'ex. VAT', key: 'sumaBePvm', width: 14 },
    { header: 'VAT', key: 'pvmSuma', width: 12 },
    { header: 'incl. VAT', key: 'sumaSuPvm', width: 14 },
    { header: 'Notes', key: 'pastaba', width: 40 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E40AF' },
  };
  headerRow.alignment = { vertical: 'middle', wrapText: true };

  for (const r of rows) {
    ws.addRow({
      failas: r.failas ?? '',
      data: r.data ?? '',
      saskaitosNumeris: r.saskaitosNumeris ?? '',
      pardavejas: r.pardavejas ?? '',
      pirkejas: r.pirkejas ?? '',
      sumaBePvm: r.sumaBePvm ?? '',
      pvmSuma: r.pvmSuma ?? '',
      sumaSuPvm: r.sumaSuPvm ?? '',
      pastaba: r.pastaba ?? '',
    });
  }

  ws.eachRow((row, rowNumber) => {
    row.height = rowNumber === 1 ? 22 : undefined;
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      if (rowNumber > 1) {
        cell.alignment = { vertical: 'middle', wrapText: true };
      }
    });
  });

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
