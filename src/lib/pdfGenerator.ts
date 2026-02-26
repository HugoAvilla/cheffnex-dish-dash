/**
 * pdfGenerator.ts
 * Gerador de PDF para relatórios do CheffNex
 * Usa jsPDF + jspdf-autotable
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface ReportPDFData {
  title: string;
  period?: { start: string; end: string };
  columns: string[];
  rows: string[][];
  summary?: { label: string; value: string }[];
}

// ─── Brand colors ──────────────────────────────────────────────────────────────
const BRAND_PRIMARY = [30, 41, 59] as [number, number, number];    // slate-800
const BRAND_ACCENT = [220, 38, 38] as [number, number, number];    // red-600 (accent)
const BRAND_LIGHT = [248, 250, 252] as [number, number, number];   // slate-50
const BRAND_MUTED = [100, 116, 139] as [number, number, number];   // slate-500
const BRAND_BORDER = [226, 232, 240] as [number, number, number];  // slate-200

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(dateStr: string) {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

function fmtPeriod(start: string, end: string) {
  return `Período: ${fmtDate(start)} a ${fmtDate(end)}`;
}

// ─── Main generator ────────────────────────────────────────────────────────────

export function generateReportPDF(data: ReportPDFData): void {
  const doc = new jsPDF("landscape", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // ── Header bar ─────────────────────────────────────────────────────────────
  doc.setFillColor(...BRAND_PRIMARY);
  doc.rect(0, 0, pageWidth, 20, "F");

  // Brand name
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("CheffNex", margin, 13);

  // Report title (right side of header)
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 210, 220);
  doc.text("Relatório de Gestão", pageWidth - margin, 13, { align: "right" });

  // ── Report title ──────────────────────────────────────────────────────────
  let y = 30;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text(data.title, margin, y);
  y += 7;

  // Period / subtitle
  if (data.period) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND_MUTED);
    doc.text(fmtPeriod(data.period.start, data.period.end), margin, y);
    y += 5;
  }

  // Generated at
  doc.setFontSize(8);
  doc.setTextColor(...BRAND_MUTED);
  doc.text(
    `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    pageWidth - margin,
    data.period ? y - 5 : y,
    { align: "right" }
  );
  y += 3;

  // Divider line
  doc.setDrawColor(...BRAND_BORDER);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ── Summary cards (if present) ────────────────────────────────────────────
  if (data.summary && data.summary.length > 0) {
    const cardCount = data.summary.length;
    const cardWidth = Math.min(contentWidth / cardCount, 55);
    const cardHeight = 16;
    const totalCardsWidth = cardWidth * cardCount;
    const startX = margin + (contentWidth - totalCardsWidth) / 2;

    data.summary.forEach((item, i) => {
      const cx = startX + i * cardWidth;

      // Card background
      doc.setFillColor(...BRAND_LIGHT);
      doc.setDrawColor(...BRAND_BORDER);
      doc.setLineWidth(0.3);
      doc.roundedRect(cx, y, cardWidth - 2, cardHeight, 2, 2, "FD");

      // Accent bar on top
      doc.setFillColor(...BRAND_ACCENT);
      doc.roundedRect(cx, y, cardWidth - 2, 2.5, 1, 1, "F");

      // Value
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...BRAND_PRIMARY);
      doc.text(item.value, cx + (cardWidth - 2) / 2, y + 9, {
        align: "center",
      });

      // Label
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...BRAND_MUTED);
      doc.text(item.label, cx + (cardWidth - 2) / 2, y + 13.5, {
        align: "center",
      });
    });

    y += cardHeight + 6;
  }

  // ── Data table ────────────────────────────────────────────────────────────
  if (data.rows.length === 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...BRAND_MUTED);
    doc.text(
      "Nenhum dado encontrado para o período selecionado.",
      pageWidth / 2,
      y + 10,
      { align: "center" }
    );
  } else {
    autoTable(doc, {
      startY: y,
      head: [data.columns],
      body: data.rows,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 8,
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
        font: "helvetica",
        textColor: [30, 41, 59],
        lineColor: BRAND_BORDER,
        lineWidth: 0.2,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: BRAND_PRIMARY,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        halign: "left",
      },
      alternateRowStyles: {
        fillColor: BRAND_LIGHT,
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
      },
      didDrawPage: (hookData) => {
        const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber;

        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...BRAND_MUTED);
        doc.text(
          `CheffNex — ${data.title}`,
          margin,
          pageHeight - 6
        );
        doc.text(
          `Página ${pageNum}`,
          pageWidth - margin,
          pageHeight - 6,
          { align: "right" }
        );

        doc.setDrawColor(...BRAND_BORDER);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
      },
    });
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  const safeTitle = data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const dateStr = format(new Date(), "yyyy-MM-dd");
  const filename = `cheffnex-${safeTitle}-${dateStr}.pdf`;

  doc.save(filename);
}
