import type {
  ContactInfo,
  EducationEntry,
  ExperienceEntry,
  ParsedResume,
  ProjectEntry,
} from '../types/resume';
import { EMPTY_RESUME } from '../types/resume';

const SECTION_PATTERNS: Record<string, RegExp> = {
  summary: /^(summary|profile|objective|about)\b/i,
  education: /^(education|academic)\b/i,
  experience: /^(experience|work\s*experience|employment|professional\s*experience)\b/i,
  projects: /^(projects?|personal\s*projects?)\b/i,
  skills: /^(skills?|technical\s*skills?|competencies)\b/i,
  leadership: /^(leadership|activities|extracurricular|involvement)\b/i,
  additionalExperience: /^(additional\s*experience|other\s*experience|volunteer)\b/i,
};

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/i;
const PHONE_RE =
  /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+\d{1,3}[-.\s]?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{2,9}/;
const DATE_RANGE_RE =
  /(.+?)\s*[|–—-]\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}.*|\d{4}\s*[-–—]\s*(?:\d{4}|present|current)|(?:spring|summer|fall|winter)\s*\d{4}.*)/i;
const YEAR_RANGE_LINE_RE = /^(\d{4})\s*[-–—]\s*(\d{4}|present|current)$/i;
const SKILL_BULLET_RE =
  /^(?:familiar with|skilled in|proficient in|strong |experience with|knowledge of|ability to|expertise in|competent in|excellent |working knowledge)/i;
const BULLET_RE = /^[-*•●▪]\s+/;
const MARKDOWN_HEADER_RE = /^#{1,3}\s+/;
const LABELED_FIELD_RE =
  /^(portfolio|github|linkedin|email|phone|website|military\s*service)\s*:\s*(.+)$/i;
const INLINE_LABEL_RE =
  /(portfolio|github|linkedin|email|phone|website|military\s*service)\s*:\s*/gi;
const PROSE_START_RE = /\b(?:professional\s+summary|summary|objective|profile)\b\s*:?\s*/i;
const BARE_DOMAIN_RE =
  /\b([\w-]+\.(?:com|io|dev|design|me|net|org|co))\b/i;

function cleanLine(line: string): string {
  return line
    .replace(MARKDOWN_HEADER_RE, '')
    .replace(BULLET_RE, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .trim();
}

function isSectionHeader(line: string): string | null {
  const cleaned = cleanLine(line).replace(/:$/, '').trim();
  for (const [key, pattern] of Object.entries(SECTION_PATTERNS)) {
    if (pattern.test(cleaned)) return key;
  }
  if (/^[A-Z][A-Z\s&/]+$/.test(cleaned) && cleaned.length < 40) {
    const lower = cleaned.toLowerCase();
    for (const [key, pattern] of Object.entries(SECTION_PATTERNS)) {
      if (pattern.test(lower)) return key;
    }
  }
  return null;
}

function normalizeLink(value: string): string {
  return value.trim().replace(/[.,;]+$/, '').replace(/^https?:\/\//i, '');
}

function applyLabeledField(
  updates: Partial<ContactInfo>,
  label: string,
  value: string,
): string | undefined {
  const key = label.toLowerCase().replace(/\s+/g, '');

  if (key === 'portfolio' || key === 'website') {
    updates.website = normalizeLink(value);
    return undefined;
  }
  if (key === 'github') {
    updates.github = normalizeLink(value);
    return undefined;
  }
  if (key === 'linkedin') {
    updates.linkedin = normalizeLink(value);
    return undefined;
  }
  if (key === 'email') {
    updates.email = value.match(EMAIL_RE)?.[0] || value.trim();
    return undefined;
  }
  if (key === 'phone') {
    updates.phone = value.match(PHONE_RE)?.[0] || value.trim();
    return undefined;
  }
  if (key === 'militaryservice') {
    return value.trim().replace(/[.,;]+$/, '');
  }

  return undefined;
}

function getInlineFieldEnd(text: string, valueStart: number, nextLabelStart: number): number {
  const slice = text.slice(valueStart, nextLabelStart);
  const stopMatch = slice.search(PROSE_START_RE);
  if (stopMatch >= 0) return valueStart + stopMatch;
  return nextLabelStart;
}

function extractInlineLabeledFields(text: string): {
  cleaned: string;
  contact: Partial<ContactInfo>;
  military?: string;
} {
  const contact: Partial<ContactInfo> = {};
  let military: string | undefined;
  const matches = [...text.matchAll(INLINE_LABEL_RE)];

  if (matches.length === 0) {
    return { cleaned: text, contact };
  }

  let proseStart = text.length;

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const valueStart = match.index! + match[0].length;
    const nextStart = i + 1 < matches.length ? matches[i + 1].index! : text.length;
    const valueEnd = getInlineFieldEnd(text, valueStart, nextStart);
    const value = text.slice(valueStart, valueEnd).trim();
    const militaryValue = applyLabeledField(contact, match[1], value);

    if (militaryValue) military = militaryValue;

    const stopInSlice = text.slice(valueStart, nextStart).search(PROSE_START_RE);
    if (stopInSlice >= 0) {
      proseStart = Math.min(proseStart, valueStart + stopInSlice);
    }
  }

  let cleaned =
    proseStart < text.length
      ? text.slice(proseStart)
      : matches.reduceRight((acc, match, i) => {
          const valueStart = match.index! + match[0].length;
          const nextStart =
            i + 1 < matches.length ? matches[i + 1].index! : text.length;
          const valueEnd = getInlineFieldEnd(text, valueStart, nextStart);
          return acc.slice(0, match.index!) + acc.slice(valueEnd);
        }, text);

  cleaned = cleaned.replace(PROSE_START_RE, '').replace(/\s+/g, ' ').trim();
  return { cleaned, contact, military };
}

function finalizeSummaryText(text: string, military?: string): string {
  let summary = text
    .replace(PROSE_START_RE, '')
    .replace(/^(?:professional\s+)?summary\s*:?\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (military && summary && !summary.toLowerCase().includes(military.toLowerCase())) {
    summary = `${military}. ${summary}`;
  }

  return summary;
}

function parseSummaryContent(input: string[]): {
  summary: string;
  contactUpdates: Partial<ContactInfo>;
} {
  const contactUpdates: Partial<ContactInfo> = {};
  let military: string | undefined;
  const proseLines: string[] = [];

  for (const rawLine of input) {
    const line = cleanLine(rawLine);
    if (!line) continue;

    const labeled = line.match(LABELED_FIELD_RE);
    if (labeled) {
      const militaryValue = applyLabeledField(contactUpdates, labeled[1], labeled[2]);
      if (militaryValue) military = militaryValue;
      continue;
    }

    proseLines.push(line);
  }

  const inline = extractInlineLabeledFields(proseLines.join(' '));
  Object.assign(contactUpdates, inline.contact);
  if (inline.military) military = inline.military;

  return {
    summary: finalizeSummaryText(inline.cleaned || proseLines.join(' '), military),
    contactUpdates,
  };
}

function mergeContact(base: ContactInfo, updates: Partial<ContactInfo>): ContactInfo {
  return {
    ...base,
    email: base.email || updates.email,
    phone: base.phone || updates.phone,
    location: base.location || updates.location,
    linkedin: base.linkedin || updates.linkedin,
    github: base.github || updates.github,
    website: base.website || updates.website,
  };
}

function enrichContactFromText(contact: ContactInfo, text: string): ContactInfo {
  const enriched = { ...contact };

  if (!enriched.github) {
    const github = text.match(/github\.com\/[\w-]+/i);
    if (github) enriched.github = normalizeLink(github[0]);
  }

  if (!enriched.linkedin) {
    const linkedin = text.match(/linkedin\.com\/(?:in\/)?[\w-]+/i);
    if (linkedin) enriched.linkedin = normalizeLink(linkedin[0]);
  }

  if (!enriched.website) {
    const website = text.match(/https?:\/\/[^\s|]+/i);
    if (website && !website[0].includes('github') && !website[0].includes('linkedin')) {
      enriched.website = normalizeLink(website[0]);
    } else {
      const domain = text.match(BARE_DOMAIN_RE);
      if (
        domain &&
        !domain[1].includes('github.com') &&
        !domain[1].includes('linkedin.com')
      ) {
        enriched.website = domain[1];
      }
    }
  }

  return enriched;
}

function parseContactFromLines(lines: string[]): ContactInfo {
  const contact: ContactInfo = { name: 'Your Name' };
  const contactLines: string[] = [];

  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = cleanLine(lines[i]);
    if (!line || isSectionHeader(line)) break;
    contactLines.push(line);
  }

  if (contactLines.length === 0) return contact;

  contact.name = contactLines[0].replace(/\|/g, ' ').trim();

  const rest = contactLines.slice(1).join(' | ');
  const allText = [contactLines[0], rest].join(' | ');

  const email = allText.match(EMAIL_RE);
  if (email) contact.email = email[0];

  const phone = allText.match(PHONE_RE);
  if (phone) contact.phone = phone[0].trim();

  const linkedin = allText.match(/linkedin\.com\/[^\s|]+/i);
  if (linkedin) contact.linkedin = linkedin[0].replace(/^https?:\/\//, '');

  const github = allText.match(/github\.com\/[^\s|]+/i);
  if (github) contact.github = github[0].replace(/^https?:\/\//, '');

  const website = allText.match(/https?:\/\/[^\s|]+/i);
  if (website && !website[0].includes('linkedin') && !website[0].includes('github')) {
    contact.website = website[0];
  }

  const parts = allText.split('|').map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    if (
      EMAIL_RE.test(part) ||
      PHONE_RE.test(part) ||
      /linkedin|github|http/i.test(part) ||
      part === contact.name
    ) {
      continue;
    }
    if (!contact.location && /[A-Za-z]+,\s*[A-Z]{2}/.test(part)) {
      contact.location = part;
    }
  }

  return contact;
}

function parseSkillsBlock(text: string): string[] {
  const lines = text
    .split('\n')
    .map(cleanLine)
    .filter(Boolean);

  const skills: string[] = [];
  for (const line of lines) {
    const segments = line.split(/[,;|•]/).map((s) => s.trim()).filter(Boolean);
    skills.push(...segments);
  }
  return [...new Set(skills)];
}

function looksLikeSkillStatement(line: string): boolean {
  return SKILL_BULLET_RE.test(cleanLine(line));
}

function partitionEntryBullets(bullets: string[]): {
  jobBullets: string[];
  skillBullets: string[];
} {
  const jobBullets: string[] = [];
  const skillBullets: string[] = [];
  let reachedSkills = false;

  for (const bullet of bullets) {
    if (!reachedSkills && looksLikeSkillStatement(bullet)) {
      reachedSkills = true;
    }
    if (reachedSkills) skillBullets.push(bullet);
    else jobBullets.push(bullet);
  }

  return { jobBullets, skillBullets };
}

function parseYearRangeLine(line: string): string | null {
  const match = cleanLine(line).match(YEAR_RANGE_LINE_RE);
  if (!match) return null;
  return `${match[1]} – ${match[2]}`;
}

function parseExperienceEntry(lines: string[]): ExperienceEntry | null {
  if (lines.length === 0) return null;

  const header = cleanLine(lines[0]);
  let title = header;
  let organization = '';
  let location = '';
  let dateRange = '';

  const pipeParts = header.split('|').map((p) => p.trim());
  if (pipeParts.length >= 2) {
    title = pipeParts[0];
    organization = pipeParts[1];
    if (pipeParts[2]) dateRange = pipeParts[2];
    if (pipeParts[3]) location = pipeParts[3];
  } else {
    const dateMatch = header.match(DATE_RANGE_RE);
    if (dateMatch) {
      title = dateMatch[1].trim();
      dateRange = dateMatch[2].trim();
    }

    const commaOrg = title.match(/^(.+?),\s*(.+)$/);
    if (commaOrg) {
      title = commaOrg[1].trim();
      organization = commaOrg[2].trim();
    }

    const atMatch = title.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i);
    if (atMatch) {
      title = atMatch[1].trim();
      organization = atMatch[2].trim();
    }
  }

  if (lines.length > 1) {
    const second = cleanLine(lines[1]);
    if (!BULLET_RE.test(lines[1])) {
      const yearRange = parseYearRangeLine(second);
      if (yearRange) {
        dateRange = dateRange || yearRange;
      } else {
        const subDate = second.match(DATE_RANGE_RE);
        if (subDate) {
          if (!organization) organization = subDate[1].trim();
          dateRange = dateRange || subDate[2].trim();
        } else if (!organization) {
          organization = second;
        } else if (!dateRange) {
          dateRange = second;
        }
      }
    }
  }

  const bullets = lines
    .filter((l) => BULLET_RE.test(l))
    .map(cleanLine)
    .filter(Boolean);

  if (!title && bullets.length === 0) return null;

  return {
    title: title || 'Role',
    organization: organization || '',
    location,
    dateRange,
    bullets,
  };
}

function isSkillOnlyBlock(lines: string[]): boolean {
  return (
    lines.length > 0 &&
    lines.every((l) => BULLET_RE.test(l) && looksLikeSkillStatement(l))
  );
}

function parseExperienceBlocks(
  sectionText: string,
): { entries: ExperienceEntry[]; extraSkills: string[] } {
  const entries: ExperienceEntry[] = [];
  const extraSkills: string[] = [];

  for (const block of splitIntoBlocks(sectionText)) {
    if (isSkillOnlyBlock(block)) {
      extraSkills.push(...block.map(cleanLine).filter(Boolean));
      continue;
    }

    const entry = parseExperienceEntry(block);
    if (!entry) continue;

    const { jobBullets, skillBullets } = partitionEntryBullets(entry.bullets);
    entry.bullets = jobBullets;
    extraSkills.push(...skillBullets);

    if (entry.title || entry.bullets.length > 0) {
      entries.push(entry);
    }
  }

  return { entries, extraSkills };
}

function parseEducationEntry(lines: string[]): EducationEntry | null {
  if (lines.length === 0) return null;

  const header = cleanLine(lines[0]);
  let degree = header;
  let school = '';
  let location = '';
  let dateRange = '';

  const pipeParts = header.split('|').map((p) => p.trim());
  if (pipeParts.length >= 2) {
    degree = pipeParts[0];
    school = pipeParts[1];
    if (pipeParts[2]) dateRange = pipeParts[2];
    if (pipeParts[3]) location = pipeParts[3];
  } else {
    const dateMatch = header.match(DATE_RANGE_RE);
    if (dateMatch) {
      degree = dateMatch[1].trim();
      dateRange = dateMatch[2].trim();
    }
    const commaSchool = degree.match(/^(.+),\s*(.+)$/);
    if (commaSchool && !school) {
      degree = commaSchool[1].trim();
      school = commaSchool[2].trim();
    }
  }

  if (lines.length > 1 && !school) {
    const second = cleanLine(lines[1]);
    if (!BULLET_RE.test(lines[1])) {
      school = second;
    }
  }

  const details = lines
    .filter((l) => BULLET_RE.test(l))
    .map(cleanLine)
    .filter(Boolean);

  if (!degree && details.length === 0) return null;

  return {
    degree: degree || 'Degree',
    school: school || 'University',
    location,
    dateRange,
    details,
  };
}

function parseProjectEntry(lines: string[]): ProjectEntry | null {
  if (lines.length === 0) return null;

  const header = cleanLine(lines[0]);
  let name = header;
  let technologies = '';
  let dateRange = '';

  const pipeParts = header.split('|').map((p) => p.trim());
  if (pipeParts.length >= 2) {
    name = pipeParts[0];
    technologies = pipeParts[1];
    if (pipeParts[2]) dateRange = pipeParts[2];
  }

  const techMatch = name.match(/^(.+?)\s*[\[(](.+?)[\])]$/);
  if (techMatch) {
    name = techMatch[1].trim();
    technologies = techMatch[2].trim();
  }

  const bullets = lines
    .filter((l) => BULLET_RE.test(l))
    .map(cleanLine)
    .filter(Boolean);

  if (!name && bullets.length === 0) return null;

  return {
    name: name || 'Project',
    technologies,
    dateRange,
    bullets,
  };
}

function hasBullets(lines: string[]): boolean {
  return lines.some((l) => BULLET_RE.test(l));
}

function hasEntryMeta(lines: string[]): boolean {
  return lines.some((l) => {
    const cleaned = cleanLine(l);
    return (
      YEAR_RANGE_LINE_RE.test(cleaned) ||
      DATE_RANGE_RE.test(cleaned) ||
      (/\|/.test(cleaned) && /\d{4}|present|current/i.test(cleaned))
    );
  });
}

function isCompleteJobBlock(lines: string[]): boolean {
  return lines.length > 0 && !BULLET_RE.test(lines[0]) && hasBullets(lines);
}

function isNewEntryLine(line: string, current: string[]): boolean {
  if (current.length === 0) return false;

  if (BULLET_RE.test(line)) {
    return isCompleteJobBlock(current) && looksLikeSkillStatement(line);
  }

  return hasBullets(current) || hasEntryMeta(current);
}

function splitIntoBlocks(sectionText: string): string[][] {
  const lines = sectionText.split('\n');
  const blocks: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (current.length > 0) {
        blocks.push(current);
        current = [];
      }
      continue;
    }

    if (isNewEntryLine(trimmed, current)) {
      blocks.push(current);
      current = [trimmed];
    } else {
      current.push(trimmed);
    }
  }

  if (current.length > 0) blocks.push(current);
  return blocks;
}

export function parseResume(rawText: string): ParsedResume {
  if (!rawText.trim()) return { ...EMPTY_RESUME };

  const lines = rawText.split('\n');
  const sections: Record<string, string[]> = {};
  let currentSection = 'preamble';
  sections[currentSection] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const sectionKey = isSectionHeader(trimmed);
    if (sectionKey) {
      currentSection = sectionKey;
      sections[currentSection] = sections[currentSection] || [];
      continue;
    }

    sections[currentSection] = sections[currentSection] || [];
    sections[currentSection].push(trimmed);
  }

  const preamble = sections.preamble || [];

  let summaryStart = 1;
  for (let i = 1; i < preamble.length; i++) {
    const line = cleanLine(preamble[i]);
    if (EMAIL_RE.test(line) || PHONE_RE.test(line) || line.includes('|')) {
      summaryStart = i + 1;
    }
  }
  const preambleSummaryLines = preamble
    .slice(summaryStart)
    .map(cleanLine)
    .filter((l) => l && !BULLET_RE.test(l));

  let summary = '';
  let contact = parseContactFromLines(preamble);

  if (sections.summary?.length) {
    const parsedSummary = parseSummaryContent(sections.summary);
    summary = parsedSummary.summary;
    contact = mergeContact(contact, parsedSummary.contactUpdates);
  } else if (preambleSummaryLines.length > 0) {
    const parsedSummary = parseSummaryContent(preambleSummaryLines);
    summary = parsedSummary.summary;
    contact = mergeContact(contact, parsedSummary.contactUpdates);
  }

  contact = enrichContactFromText(contact, rawText);

  const education = splitIntoBlocks((sections.education || []).join('\n'))
    .map(parseEducationEntry)
    .filter((e): e is EducationEntry => e !== null);

  const experienceParsed = parseExperienceBlocks((sections.experience || []).join('\n'));
  const experience = experienceParsed.entries;

  const projects = splitIntoBlocks((sections.projects || []).join('\n'))
    .map(parseProjectEntry)
    .filter((p): p is ProjectEntry => p !== null);

  const leadershipParsed = parseExperienceBlocks((sections.leadership || []).join('\n'));
  const leadership = leadershipParsed.entries;

  const additionalParsed = parseExperienceBlocks(
    (sections.additionalExperience || []).join('\n'),
  );
  const additionalExperience = additionalParsed.entries;

  const skills = [
    ...new Set([
      ...parseSkillsBlock((sections.skills || []).join('\n')),
      ...experienceParsed.extraSkills,
      ...leadershipParsed.extraSkills,
      ...additionalParsed.extraSkills,
    ]),
  ];

  return {
    contact,
    summary,
    education,
    experience,
    projects,
    skills,
    leadership,
    additionalExperience,
  };
}
