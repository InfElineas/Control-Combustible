import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

function getVal(row, accessor) {
  const v = typeof accessor === 'function' ? accessor(row) : row[accessor];
  return v == null ? '' : v;
}

async function exportXlsx(data, columns, filename) {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'WebCombustible';
  wb.created = new Date();
  const ws = wb.addWorksheet('Reporte');

  ws.columns = columns.map(c => ({
    header: c.label,
    key: c.label,
    width: Math.max(String(c.label).length + 4, 14),
  }));

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 20;

  data.forEach((row, ri) => {
    const values = { id: ri + 2 };
    columns.forEach(c => { values[c.label] = getVal(row, c.accessor); });
    const dataRow = ws.addRow(values);
    if (ri % 2 === 1) {
      dataRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }
  });

  ws.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top:    { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left:   { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right:  { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportPdf(data, columns, filename, title) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const landscape = columns.length > 5;
  const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm' });

  const pageW = doc.internal.pageSize.getWidth();
  const today = new Date().toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' });

  if (title) {
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(title, 14, 16);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(today, 14, 22);
    doc.text(`${data.length} registros`, pageW - 14, 22, { align: 'right' });
  }

  const head = [columns.map(c => c.label)];
  const body = data.map(row => columns.map(c => String(getVal(row, c.accessor))));

  autoTable(doc, {
    head,
    body,
    startY: title ? 27 : 14,
    styles: { fontSize: 8, cellPadding: { top: 2, right: 3, bottom: 2, left: 3 }, overflow: 'linebreak' },
    headStyles: { fillColor: [71, 85, 105], textColor: 255, fontStyle: 'bold', halign: 'center' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.2,
    margin: { left: 14, right: 14 },
    didDrawPage: (hookData) => {
      const pageCount = doc.internal.getNumberOfPages();
      const pageNum = hookData.pageNumber;
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`Página ${pageNum} de ${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
    },
  });

  doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export default function ExportButton({ data, columns, filename = 'export', title }) {
  const [loading, setLoading] = useState(null);
  const disabled = !data?.length;

  const handle = async (type) => {
    if (disabled || loading) return;
    setLoading(type);
    try {
      if (type === 'xlsx') await exportXlsx(data, columns, filename);
      else await exportPdf(data, columns, filename, title);
    } catch (e) {
      console.error('Export error:', e);
    }
    setLoading(null);
  };

  return (
    <div className="flex rounded-md shadow-sm">
      <Button
        variant="outline" size="sm"
        className="rounded-r-none border-r-0 gap-1.5 text-xs h-8 px-3"
        onClick={() => handle('xlsx')}
        disabled={disabled || !!loading}
        title="Exportar Excel"
      >
        {loading === 'xlsx'
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Download className="w-3.5 h-3.5" />}
        XLSX
      </Button>
      <Button
        variant="outline" size="sm"
        className="rounded-l-none gap-1 text-xs h-8 px-3"
        onClick={() => handle('pdf')}
        disabled={disabled || !!loading}
        title="Exportar PDF"
      >
        {loading === 'pdf'
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Download className="w-3.5 h-3.5" />}
        PDF
      </Button>
    </div>
  );
}
