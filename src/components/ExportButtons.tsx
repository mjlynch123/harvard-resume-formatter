import { useState } from 'react';
import type { ParsedResume } from '../types/resume';
import {
  copyToClipboard,
  exportAsDocx,
  exportAsHtml,
  exportAsMarkdown,
  exportAsPdf,
  exportAsPlainText,
  printResume,
} from '../utils/exportResume';

interface ExportButtonsProps {
  resume: ParsedResume;
  previewRef: React.RefObject<HTMLDivElement | null>;
}

type ExportAction = 'pdf' | 'docx' | 'md' | 'txt' | 'html' | 'copy' | 'print';

export function ExportButtons({ resume, previewRef }: ExportButtonsProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<ExportAction | null>(null);

  const showStatus = (message: string) => {
    setStatus(message);
    setTimeout(() => setStatus(null), 2500);
  };

  const runExport = async (action: ExportAction, fn: () => Promise<void> | void) => {
    try {
      setLoading(action);
      await fn();
      if (action === 'copy') showStatus('Copied to clipboard');
      else if (action === 'print') showStatus('Opening print dialog…');
      else showStatus('Download started');
    } catch {
      showStatus('Export failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const buttons: { action: ExportAction; label: string; handler: () => Promise<void> | void }[] = [
    {
      action: 'pdf',
      label: 'PDF',
      handler: () => {
        if (!previewRef.current) throw new Error('Preview not ready');
        return exportAsPdf(previewRef.current, resume.contact.name);
      },
    },
    { action: 'docx', label: 'DOCX', handler: () => exportAsDocx(resume) },
    { action: 'md', label: 'Markdown', handler: () => exportAsMarkdown(resume) },
    { action: 'txt', label: 'Plain Text', handler: () => exportAsPlainText(resume) },
    { action: 'html', label: 'HTML', handler: () => exportAsHtml(resume) },
    { action: 'copy', label: 'Copy', handler: () => copyToClipboard(resume) },
    { action: 'print', label: 'Print', handler: () => printResume() },
  ];

  return (
    <div className="export-panel">
      <h3 className="export-title">Export</h3>
      <div className="export-buttons">
        {buttons.map(({ action, label, handler }) => (
          <button
            key={action}
            type="button"
            className="export-btn"
            disabled={loading !== null}
            onClick={() => runExport(action, handler)}
          >
            {loading === action ? '…' : label}
          </button>
        ))}
      </div>
      {status && <p className="export-status">{status}</p>}
    </div>
  );
}
