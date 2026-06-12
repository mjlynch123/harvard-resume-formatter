import type { ParsedResume } from '../types/resume';
import { SECTION_LABELS } from '../types/resume';

function formatContactLine(resume: ParsedResume): string {
  const { contact } = resume;
  return [
    contact.email,
    contact.phone,
    contact.location,
    contact.website,
    contact.github,
    contact.linkedin,
  ]
    .filter(Boolean)
    .join(' | ');
}

function formatExperienceBlock(entries: ParsedResume['experience']): string {
  return entries
    .map((entry) => {
      const header = [
        `${entry.title}${entry.organization ? `, ${entry.organization}` : ''}`,
        [entry.location, entry.dateRange].filter(Boolean).join(' | '),
      ]
        .filter(Boolean)
        .join('\n');
      const bullets = entry.bullets.map((b) => `• ${b}`).join('\n');
      return [header, bullets].filter(Boolean).join('\n');
    })
    .join('\n\n');
}

function formatEducationBlock(entries: ParsedResume['education']): string {
  return entries
    .map((entry) => {
      const header = [
        `${entry.degree}${entry.school ? `, ${entry.school}` : ''}`,
        [entry.location, entry.dateRange].filter(Boolean).join(' | '),
      ]
        .filter(Boolean)
        .join('\n');
      const details = entry.details.map((d) => `• ${d}`).join('\n');
      return [header, details].filter(Boolean).join('\n');
    })
    .join('\n\n');
}

function formatProjectsBlock(entries: ParsedResume['projects']): string {
  return entries
    .map((entry) => {
      const title = entry.technologies
        ? `${entry.name} [${entry.technologies}]`
        : entry.name;
      const header = [title, entry.dateRange].filter(Boolean).join(' | ');
      const bullets = entry.bullets.map((b) => `• ${b}`).join('\n');
      return [header, bullets].filter(Boolean).join('\n');
    })
    .join('\n\n');
}

export function toPlainText(resume: ParsedResume): string {
  const parts: string[] = [resume.contact.name, formatContactLine(resume)];

  if (resume.summary) {
    parts.push('', SECTION_LABELS.summary, resume.summary);
  }
  if (resume.education.length) {
    parts.push('', SECTION_LABELS.education, formatEducationBlock(resume.education));
  }
  if (resume.experience.length) {
    parts.push('', SECTION_LABELS.experience, formatExperienceBlock(resume.experience));
  }
  if (resume.projects.length) {
    parts.push('', SECTION_LABELS.projects, formatProjectsBlock(resume.projects));
  }
  if (resume.skills.length) {
    parts.push('', SECTION_LABELS.skills, resume.skills.join(' • '));
  }
  if (resume.leadership.length) {
    parts.push('', SECTION_LABELS.leadership, formatExperienceBlock(resume.leadership));
  }
  if (resume.additionalExperience.length) {
    parts.push(
      '',
      SECTION_LABELS.additionalExperience,
      formatExperienceBlock(resume.additionalExperience),
    );
  }

  return parts.filter((p, i) => i > 1 || p).join('\n');
}

export function toMarkdown(resume: ParsedResume): string {
  const parts: string[] = [
    `# ${resume.contact.name}`,
    formatContactLine(resume),
  ];

  if (resume.summary) {
    parts.push('', `## ${SECTION_LABELS.summary}`, resume.summary);
  }
  if (resume.education.length) {
    parts.push('', `## ${SECTION_LABELS.education}`, formatEducationBlock(resume.education));
  }
  if (resume.experience.length) {
    parts.push('', `## ${SECTION_LABELS.experience}`, formatExperienceBlock(resume.experience));
  }
  if (resume.projects.length) {
    parts.push('', `## ${SECTION_LABELS.projects}`, formatProjectsBlock(resume.projects));
  }
  if (resume.skills.length) {
    parts.push('', `## ${SECTION_LABELS.skills}`, resume.skills.join(', '));
  }
  if (resume.leadership.length) {
    parts.push('', `## ${SECTION_LABELS.leadership}`, formatExperienceBlock(resume.leadership));
  }
  if (resume.additionalExperience.length) {
    parts.push(
      '',
      `## ${SECTION_LABELS.additionalExperience}`,
      formatExperienceBlock(resume.additionalExperience),
    );
  }

  return parts.join('\n');
}

const RESUME_CSS = `
  body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.15; color: #000; margin: 0.5in; }
  .resume { max-width: 7.5in; margin: 0 auto; }
  .resume-name { text-align: center; font-size: 14pt; font-weight: bold; margin: 0 0 2px; }
  .resume-contact { text-align: center; font-size: 10pt; margin: 0 0 8px; }
  .resume-section { margin-bottom: 8px; }
  .resume-section-title { font-size: 10pt; font-weight: bold; letter-spacing: 0.5px; border-bottom: 0.5px solid #000; padding-bottom: 1px; margin: 6px 0 4px; text-transform: uppercase; }
  .entry-header { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .entry-title { font-weight: bold; }
  .entry-meta { text-align: right; white-space: nowrap; font-size: 10pt; }
  .entry-subtitle { font-style: italic; }
  .entry-bullets { margin: 2px 0 4px; padding-left: 14px; }
  .entry-bullets li { margin-bottom: 1px; }
  .skills-line { margin: 2px 0; }
  .summary-text { margin: 2px 0 4px; }
`;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function toHtmlDocument(resume: ParsedResume): string {
  const contactLine = formatContactLine(resume);

  const section = (title: string, body: string) =>
    body ? `<section class="resume-section"><h2 class="resume-section-title">${title}</h2>${body}</section>` : '';

  const experienceHtml = (entries: ParsedResume['experience']) =>
    entries
      .map((entry) => {
        const meta = [entry.location, entry.dateRange].filter(Boolean).join(' | ');
        const bullets = entry.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('');
        return `<div class="entry">
          <div class="entry-header">
            <div><span class="entry-title">${escapeHtml(entry.title)}</span>${entry.organization ? `, <span class="entry-subtitle">${escapeHtml(entry.organization)}</span>` : ''}</div>
            ${meta ? `<div class="entry-meta">${escapeHtml(meta)}</div>` : ''}
          </div>
          ${bullets ? `<ul class="entry-bullets">${bullets}</ul>` : ''}
        </div>`;
      })
      .join('');

  const educationHtml = resume.education
    .map((entry) => {
      const meta = [entry.location, entry.dateRange].filter(Boolean).join(' | ');
      const details = entry.details.map((d) => `<li>${escapeHtml(d)}</li>`).join('');
      return `<div class="entry">
        <div class="entry-header">
          <div><span class="entry-title">${escapeHtml(entry.degree)}</span>${entry.school ? `, <span class="entry-subtitle">${escapeHtml(entry.school)}</span>` : ''}</div>
          ${meta ? `<div class="entry-meta">${escapeHtml(meta)}</div>` : ''}
        </div>
        ${details ? `<ul class="entry-bullets">${details}</ul>` : ''}
      </div>`;
    })
    .join('');

  const projectsHtml = resume.projects
    .map((entry) => {
      const title = entry.technologies
        ? `${entry.name} [${entry.technologies}]`
        : entry.name;
      const bullets = entry.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('');
      return `<div class="entry">
        <div class="entry-header">
          <div class="entry-title">${escapeHtml(title)}</div>
          ${entry.dateRange ? `<div class="entry-meta">${escapeHtml(entry.dateRange)}</div>` : ''}
        </div>
        ${bullets ? `<ul class="entry-bullets">${bullets}</ul>` : ''}
      </div>`;
    })
    .join('');

  const body = [
    `<h1 class="resume-name">${escapeHtml(resume.contact.name)}</h1>`,
    contactLine ? `<p class="resume-contact">${escapeHtml(contactLine)}</p>` : '',
    resume.summary ? section('Summary', `<p class="summary-text">${escapeHtml(resume.summary)}</p>`) : '',
    resume.education.length ? section('Education', educationHtml) : '',
    resume.experience.length ? section('Experience', experienceHtml(resume.experience)) : '',
    resume.projects.length ? section('Projects', projectsHtml) : '',
    resume.skills.length
      ? section('Skills', `<p class="skills-line">${resume.skills.map(escapeHtml).join(' • ')}</p>`)
      : '',
    resume.leadership.length ? section('Leadership & Activities', experienceHtml(resume.leadership)) : '',
    resume.additionalExperience.length
      ? section('Additional Experience', experienceHtml(resume.additionalExperience))
      : '',
  ].join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(resume.contact.name)} - Resume</title>
  <style>${RESUME_CSS}</style>
</head>
<body>
  <div class="resume">${body}</div>
</body>
</html>`;
}
