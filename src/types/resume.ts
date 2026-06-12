export interface ContactInfo {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
  github?: string;
}

export interface ExperienceEntry {
  title: string;
  organization: string;
  location?: string;
  dateRange: string;
  bullets: string[];
}

export interface EducationEntry {
  degree: string;
  school: string;
  location?: string;
  dateRange: string;
  details: string[];
}

export interface ProjectEntry {
  name: string;
  technologies?: string;
  dateRange?: string;
  bullets: string[];
}

export interface ParsedResume {
  contact: ContactInfo;
  summary: string;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  skills: string[];
  leadership: ExperienceEntry[];
  additionalExperience: ExperienceEntry[];
}

export type ResumeSectionKey =
  | 'summary'
  | 'education'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'leadership'
  | 'additionalExperience';

export const SECTION_LABELS: Record<ResumeSectionKey, string> = {
  summary: 'SUMMARY',
  education: 'EDUCATION',
  experience: 'EXPERIENCE',
  projects: 'PROJECTS',
  skills: 'SKILLS',
  leadership: 'LEADERSHIP & ACTIVITIES',
  additionalExperience: 'ADDITIONAL EXPERIENCE',
};

export const EMPTY_RESUME: ParsedResume = {
  contact: { name: 'Your Name' },
  summary: '',
  education: [],
  experience: [],
  projects: [],
  skills: [],
  leadership: [],
  additionalExperience: [],
};
