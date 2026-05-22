import type { BlockNoteEditor } from '@blocknote/core';
import html2pdf from 'html2pdf.js';

export type ExportFormat = 'md' | 'pdf';

interface ExportDocumentOptions {
  title?: string;
  editor: BlockNoteEditor;
}

interface Html2PdfOptionsWithPagebreak {
  margin: number;
  filename: string;
  image: { type: 'jpeg'; quality: number };
  html2canvas: {
    scale: number;
    useCORS: boolean;
    backgroundColor: string;
  };
  jsPDF: {
    unit: 'mm';
    format: 'a4';
    orientation: 'portrait';
  };
  pagebreak: { mode: string[] };
}

function getSafeFilename(title?: string) {
  const fallback = 'document';
  const normalized = (title ?? fallback).trim() || fallback;

  return normalized.replace(/[\\/:*?"<>|]/g, '-').slice(0, 80);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildMarkdown({ title, editor }: ExportDocumentOptions) {
  const safeTitle = title?.trim() || '문서';
  const content = editor.blocksToMarkdownLossy(editor.document).trim();

  return `# ${safeTitle}\n\n${content || '내용이 없습니다.'}\n`;
}

export function exportDocumentAsMarkdown(options: ExportDocumentOptions) {
  const filename = `${getSafeFilename(options.title)}.md`;
  const blob = new Blob([buildMarkdown(options)], {
    type: 'text/markdown;charset=utf-8',
  });

  downloadBlob(blob, filename);
}

export function exportDocumentAsPdf({ title, editor }: ExportDocumentOptions) {
  const safeTitle = title?.trim() || '문서';
  const content = editor.blocksToHTMLLossy(editor.document).trim();
  const container = document.createElement('section');

  container.className = 'aidea-pdf-export';
  container.innerHTML = `
    <style>
      .aidea-pdf-export {
        width: 720px;
        padding: 48px;
        background: #ffffff;
        color: #1a1a1a;
        font-family: Inter, "Noto Sans KR", Arial, sans-serif;
        font-size: 15px;
        line-height: 1.75;
      }
      .aidea-pdf-export h1 {
        margin: 0 0 28px;
        font-size: 30px;
        line-height: 1.3;
        page-break-after: avoid;
      }
      .aidea-pdf-export h2,
      .aidea-pdf-export h3 {
        margin: 24px 0 10px;
        page-break-after: avoid;
      }
      .aidea-pdf-export p {
        margin: 8px 0;
      }
      .aidea-pdf-export ul,
      .aidea-pdf-export ol {
        margin: 8px 0 8px 24px;
        padding: 0;
      }
      .aidea-pdf-export blockquote {
        margin: 12px 0;
        padding-left: 14px;
        border-left: 3px solid #d4d4d4;
        color: #555;
      }
      .aidea-pdf-export pre,
      .aidea-pdf-export code {
        font-family: Consolas, "Courier New", monospace;
      }
      .aidea-pdf-export pre {
        white-space: pre-wrap;
        padding: 12px;
        border-radius: 8px;
        background: #f6f6f6;
      }
      .aidea-pdf-export table {
        width: 100%;
        border-collapse: collapse;
      }
      .aidea-pdf-export th,
      .aidea-pdf-export td {
        border: 1px solid #ddd;
        padding: 8px;
      }
    </style>
    <h1>${escapeHtml(safeTitle)}</h1>
    ${content || '<p>내용이 없습니다.</p>'}
  `;

  document.body.appendChild(container);

  const pdfOptions: Html2PdfOptionsWithPagebreak = {
    margin: 8,
    filename: `${getSafeFilename(title)}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    },
    pagebreak: { mode: ['css', 'legacy'] },
  };

  void html2pdf()
    .set(pdfOptions)
    .from(container)
    .save()
    .finally(() => container.remove());
}
