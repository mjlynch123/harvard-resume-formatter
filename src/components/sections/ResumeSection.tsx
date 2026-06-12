import type { ReactNode } from 'react';

interface ResumeSectionProps {
  title: string;
  children: ReactNode;
}

export function ResumeSection({ title, children }: ResumeSectionProps) {
  return (
    <section className="resume-section">
      <h2 className="resume-section-title">{title}</h2>
      {children}
    </section>
  );
}
