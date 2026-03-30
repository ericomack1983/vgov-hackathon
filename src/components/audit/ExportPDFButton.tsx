'use client';

import { useState, type RefObject } from 'react';
import { Download, Loader2 } from 'lucide-react';

export function ExportPDFButton({ reportRef }: { reportRef: RefObject<HTMLDivElement | null> }) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      const element = reportRef.current;
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('govprocure-audit-report.pdf');
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="bg-[#1434CB] hover:bg-[#0F27B0] text-white px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50 transition-colors"
    >
      {isExporting ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Download size={16} />
      )}
      {isExporting ? 'Generating...' : 'Export PDF'}
    </button>
  );
}
