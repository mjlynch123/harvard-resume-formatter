import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  TabStopType,
  TabStopPosition,
} from 'docx';
import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';
import type { ParsedResume } from '../types/resume';
import { toHtmlDocument, toMarkdown, toPlainText } from './serializeResume';

function downloadText(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  saveAs(blob, filename);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'resume';
}

export async function exportAsPdf(previewElement: HTMLElement, name: string) {
  const filename = `${sanitizeFilename(name)}_resume.pdf`;
  await html2pdf()
    .set({
      margin: [0.4, 0.4, 0.4, 0.4],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    })
    .from(previewElement)
    .save();
}

export async function exportAsDocx(resume: ParsedResume) {
  const contactParts = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.linkedin,
    resume.contact.github,
    resume.contact.website,
  ].filter(Boolean);

  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: resume.contact.name, bold: true, size: 28 })],
      spacing: { after: 60 },
    }),
  ];

  if (contactParts.length) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: contactParts.join(' | '), size: 20 })],
        spacing: { after: 160 },
      }),
    );
  }

  const addSection = (title: string, content: Paragraph[]) => {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 20 })],
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        },
        spacing: { before: 120, after: 80 },
      }),
    );
    children.push(...content);
  };

  if (resume.summary) {
    addSection('Summary', [
      new Paragraph({
        children: [new TextRun({ text: resume.summary, size: 22 })],
        spacing: { after: 80 },
      }),
    ]);
  }

  const addExperienceParagraphs = (entries: ParsedResume['experience']) => {
    const paragraphs: Paragraph[] = [];
    for (const entry of entries) {
      const meta = [entry.location, entry.dateRange].filter(Boolean).join(' | ');
      paragraphs.push(
        new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            new TextRun({ text: entry.title, bold: true, size: 22 }),
            ...(entry.organization
              ? [new TextRun({ text: `, ${entry.organization}`, italics: true, size: 22 })]
              : []),
            ...(meta ? [new TextRun({ text: `\t${meta}`, size: 20 })] : []),
          ],
          spacing: { after: 40 },
        }),
      );
      for (const bullet of entry.bullets) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${bullet}`, size: 22 })],
            indent: { left: 360 },
            spacing: { after: 20 },
          }),
        );
      }
    }
    return paragraphs;
  };

  if (resume.education.length) {
    const eduParagraphs: Paragraph[] = [];
    for (const entry of resume.education) {
      const meta = [entry.location, entry.dateRange].filter(Boolean).join(' | ');
      eduParagraphs.push(
        new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            new TextRun({ text: entry.degree, bold: true, size: 22 }),
            ...(entry.school
              ? [new TextRun({ text: `, ${entry.school}`, italics: true, size: 22 })]
              : []),
            ...(meta ? [new TextRun({ text: `\t${meta}`, size: 20 })] : []),
          ],
          spacing: { after: 40 },
        }),
      );
      for (const detail of entry.details) {
        eduParagraphs.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${detail}`, size: 22 })],
            indent: { left: 360 },
            spacing: { after: 20 },
          }),
        );
      }
    }
    addSection('Education', eduParagraphs);
  }

  if (resume.experience.length) {
    addSection('Experience', addExperienceParagraphs(resume.experience));
  }

  if (resume.projects.length) {
    const projectParagraphs: Paragraph[] = [];
    for (const entry of resume.projects) {
      const title = entry.technologies
        ? `${entry.name} [${entry.technologies}]`
        : entry.name;
      projectParagraphs.push(
        new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            new TextRun({ text: title, bold: true, size: 22 }),
            ...(entry.dateRange
              ? [new TextRun({ text: `\t${entry.dateRange}`, size: 20 })]
              : []),
          ],
          spacing: { after: 40 },
        }),
      );
      for (const bullet of entry.bullets) {
        projectParagraphs.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${bullet}`, size: 22 })],
            indent: { left: 360 },
            spacing: { after: 20 },
          }),
        );
      }
    }
    addSection('Projects', projectParagraphs);
  }

  if (resume.skills.length) {
    addSection('Skills', [
      new Paragraph({
        children: [new TextRun({ text: resume.skills.join(' • '), size: 22 })],
        spacing: { after: 80 },
      }),
    ]);
  }

  if (resume.leadership.length) {
    addSection('Leadership & Activities', addExperienceParagraphs(resume.leadership));
  }

  if (resume.additionalExperience.length) {
    addSection('Additional Experience', addExperienceParagraphs(resume.additionalExperience));
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${sanitizeFilename(resume.contact.name)}_resume.docx`);
}

export function exportAsMarkdown(resume: ParsedResume) {
  downloadText(
    toMarkdown(resume),
    `${sanitizeFilename(resume.contact.name)}_resume.md`,
    'text/markdown',
  );
}

export function exportAsPlainText(resume: ParsedResume) {
  downloadText(
    toPlainText(resume),
    `${sanitizeFilename(resume.contact.name)}_resume.txt`,
    'text/plain',
  );
}

export function exportAsHtml(resume: ParsedResume) {
  downloadText(
    toHtmlDocument(resume),
    `${sanitizeFilename(resume.contact.name)}_resume.html`,
    'text/html',
  );
}

export async function copyToClipboard(resume: ParsedResume) {
  const text = toPlainText(resume);
  const html = toHtmlDocument(resume);

  if (navigator.clipboard?.write) {
    const htmlBlob = new Blob([html], { type: 'text/html' });
    const textBlob = new Blob([text], { type: 'text/plain' });
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob,
      }),
    ]);
  } else {
    await navigator.clipboard.writeText(text);
  }
}

export function printResume() {
  window.print();
}
