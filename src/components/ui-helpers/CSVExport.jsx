import React from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function CSVExport({ data, columns, filename = "export" }) {
  const handleExport = () => {
    if (!data || data.length === 0) return;
    const headers = columns.map(c => c.label).join(",");
    const rows = data.map(row =>
      columns.map(c => {
        const val = typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor];
        const str = val == null ? '' : String(val);
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(",")
    ).join("\n");
    const csv = headers + "\n" + rows;
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={!data?.length}>
      <Download className="w-4 h-4 mr-2" />
      CSV
    </Button>
  );
}