import type { BlockNoteEditor } from '@blocknote/core';
import DOMPurify from 'dompurify';
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
  const safeTitle = title?.trim() || '\uBB38\uC11C';
  const content = editor.blocksToMarkdownLossy(editor.document).trim();

  return `# ${safeTitle}\n\n${content || '\uB0B4\uC6A9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.'}\n`;
}

export function exportDocumentAsMarkdown(options: ExportDocumentOptions) {
  const filename = `${getSafeFilename(options.title)}.md`;
  const blob = new Blob([buildMarkdown(options)], {
    type: 'text/markdown;charset=utf-8',
  });

  downloadBlob(blob, filename);
}

export function exportDocumentAsPdf({ title, editor }: ExportDocumentOptions) {
  const safeTitle = title?.trim() || '\uBB38\uC11C';
  const rawHtml = editor.blocksToFullHTML(editor.document).trim();
  const parsedHtml = new DOMParser().parseFromString(rawHtml, 'text/html').body.innerHTML.trim();
  const content = DOMPurify.sanitize(parsedHtml, { USE_PROFILES: { html: true } }).trim();
  const container = document.createElement('section');

  container.className = 'aidea-pdf-export';
  container.innerHTML = `
    <style>
      .aidea-pdf-export {
        width: 720px;
        padding: 44px 48px;
        background: #ffffff;
        color: #1a1a1a;
        font-family: Inter, "Noto Sans KR", Arial, sans-serif;
        font-size: 15px;
        line-height: 1.6;
      }
      .aidea-pdf-export .aidea-pdf-title {
        margin: 0 0 32px;
        font-size: 30px;
        line-height: 1.25;
        font-weight: 500;
        letter-spacing: 0;
        page-break-after: avoid;
      }
      .aidea-pdf-export h1:not(.aidea-pdf-title) {
        margin: 22px 0 14px;
        font-size: 28px;
        line-height: 1.35;
        font-weight: 700;
        page-break-after: avoid;
      }
      .aidea-pdf-export h2 {
        margin: 18px 0 10px;
        font-size: 22px;
        line-height: 1.4;
        page-break-after: avoid;
      }
      .aidea-pdf-export h3,
      .aidea-pdf-export h4,
      .aidea-pdf-export h5,
      .aidea-pdf-export h6 {
        margin: 14px 0 8px;
        font-size: 17px;
        line-height: 1.45;
        page-break-after: avoid;
      }
      .aidea-pdf-export p {
        margin: 6px 0;
      }
      .aidea-pdf-export ul,
      .aidea-pdf-export ol {
        margin: 6px 0 6px 22px;
        padding: 0;
      }
      .aidea-pdf-export li {
        margin: 4px 0;
      }
      .aidea-pdf-export li:has(input[type='checkbox']),
      .aidea-pdf-export [data-content-type='checkListItem'],
      .aidea-pdf-export [data-type='checkListItem'] {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .aidea-pdf-export input[type='checkbox'] {
        flex: 0 0 auto;
        width: 14px;
        height: 14px;
        margin: 0;
        vertical-align: middle;
      }
      .aidea-pdf-export input[type='checkbox'] {
        flex: 0 0 auto;
        idth: 14px;
        height: 14px;
        margin: 0;
        position: relative;
        top: 7px;
      } p,

      .aidea-pdf-export [data-content-type='checkListItem'] p,
      .aidea-pdf-export [data-type='checkListItem'] p {
        display: inline;
        margin: 0;
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
    <h1 class="aidea-pdf-title">${escapeHtml(safeTitle)}</h1>
    ${content || '<p>\uB0B4\uC6A9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.</p>'}
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
