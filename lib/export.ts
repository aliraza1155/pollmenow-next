// lib/export.ts
'use client';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

export async function exportAsPNG(element: HTMLElement, filename: string = 'export') {
  if (!element) throw new Error('No element provided');
  try {
    const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
    canvas.toBlob(blob => {
      saveAs(blob!, `${filename}.png`);
    });
  } catch (err) {
    console.error('PNG export failed:', err);
    throw err;
  }
}

export async function exportAsPDF(htmlContent: string, filename: string = 'export') {
  if (!htmlContent) throw new Error('No HTML content provided');
  try {
    const doc = new jsPDF();
    doc.html(htmlContent, {
      callback: function (doc) {
        doc.save(`${filename}.pdf`);
      },
      x: 10,
      y: 10,
      width: 180,
      windowWidth: 650,
    });
  } catch (err) {
    console.error('PDF export failed:', err);
    throw err;
  }
}

export async function exportElementAsPDF(element: HTMLElement, filename: string = 'export') {
  if (!element) throw new Error('No element provided');
  try {
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF('p', 'mm', 'a4');
    const imgProps = doc.getImageProperties(imgData);
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    doc.save(`${filename}.pdf`);
  } catch (err) {
    console.error('Element PDF export failed:', err);
    throw err;
  }
}

export function exportAsCSV(data: Record<string, any>[], filename: string = 'export') {
  if (!data || !data.length) throw new Error('No data to export');
  try {
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
  } catch (err) {
    console.error('CSV export failed:', err);
    throw err;
  }
}

export function exportPollResultsCSV(results: { option: string, votes: number, percentage: number }[], pollTitle: string = 'poll') {
  const csvData = results.map(r => ({
    Option: r.option,
    Votes: r.votes,
    Percentage: r.percentage.toFixed(1) + '%'
  }));
  exportAsCSV(csvData, `${pollTitle}_results`);
}