import { forwardRef } from 'react';
import type { ParsedResume } from '../types/resume';
import { SECTION_LABELS } from '../types/resume';
import { ContactHeader } from './sections/ContactHeader';
import { EntryBlock } from './sections/EntryBlock';
import { ResumeSection } from './sections/ResumeSection';
import '../styles/resume.css';

interface ResumePreviewProps {
  resume: ParsedResume;
}

export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
  function ResumePreview({ resume }, ref) {
    const hasContent =
      resume.summary ||
      resume.education.length > 0 ||
      resume.experience.length > 0 ||
      resume.projects.length > 0 ||
      resume.skills.length > 0 ||
      resume.leadership.length > 0 ||
      resume.additionalExperience.length > 0;

    return (
      <div className="resume-preview-wrapper">
        <div ref={ref} className="harvard-resume" id="resume-preview">
          <ContactHeader contact={resume.contact} />

          {!hasContent && (
            <p className="resume-placeholder">
              Nothing here yet — paste your resume on the left to get started.
            </p>
          )}

          {resume.summary && (
            <ResumeSection title={SECTION_LABELS.summary}>
              <p className="summary-text">{resume.summary}</p>
            </ResumeSection>
          )}

          {resume.education.length > 0 && (
            <ResumeSection title={SECTION_LABELS.education}>
              {resume.education.map((entry, index) => (
                <EntryBlock
                  key={index}
                  title={entry.degree}
                  subtitle={entry.school}
                  meta={[entry.location, entry.dateRange].filter(Boolean).join(' | ')}
                  bullets={entry.details}
                />
              ))}
            </ResumeSection>
          )}

          {resume.experience.length > 0 && (
            <ResumeSection title={SECTION_LABELS.experience}>
              {resume.experience.map((entry, index) => (
                <EntryBlock
                  key={index}
                  title={entry.title}
                  subtitle={entry.organization}
                  meta={[entry.location, entry.dateRange].filter(Boolean).join(' | ')}
                  bullets={entry.bullets}
                />
              ))}
            </ResumeSection>
          )}

          {resume.projects.length > 0 && (
            <ResumeSection title={SECTION_LABELS.projects}>
              {resume.projects.map((entry, index) => (
                <EntryBlock
                  key={index}
                  title={
                    entry.technologies
                      ? `${entry.name} [${entry.technologies}]`
                      : entry.name
                  }
                  meta={entry.dateRange}
                  bullets={entry.bullets}
                />
              ))}
            </ResumeSection>
          )}

          {resume.skills.length > 0 && (
            <ResumeSection title={SECTION_LABELS.skills}>
              <p className="skills-line">{resume.skills.join(' • ')}</p>
            </ResumeSection>
          )}

          {resume.leadership.length > 0 && (
            <ResumeSection title={SECTION_LABELS.leadership}>
              {resume.leadership.map((entry, index) => (
                <EntryBlock
                  key={index}
                  title={entry.title}
                  subtitle={entry.organization}
                  meta={[entry.location, entry.dateRange].filter(Boolean).join(' | ')}
                  bullets={entry.bullets}
                />
              ))}
            </ResumeSection>
          )}

          {resume.additionalExperience.length > 0 && (
            <ResumeSection title={SECTION_LABELS.additionalExperience}>
              {resume.additionalExperience.map((entry, index) => (
                <EntryBlock
                  key={index}
                  title={entry.title}
                  subtitle={entry.organization}
                  meta={[entry.location, entry.dateRange].filter(Boolean).join(' | ')}
                  bullets={entry.bullets}
                />
              ))}
            </ResumeSection>
          )}
        </div>
      </div>
    );
  },
);
