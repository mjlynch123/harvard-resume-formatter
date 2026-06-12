import { useRef } from 'react';

interface ResumeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const SAMPLE_RESUME = `Alex Rivera
alex.rivera@gmail.com | (617) 555-0182 | Cambridge, MA | github.com/alexrivera

EDUCATION
B.S. Computer Science, Northeastern University
Boston, MA | May 2024
- GPA: 3.7
- Dean's List 2022, 2023

EXPERIENCE
Software Engineer (Co-op) | Stripe
San Francisco, CA | Jan 2024 – Jun 2024
- Shipped a self-serve tax configuration flow used by 4,000+ merchants at launch
- Cut p95 API latency on the invoicing service from 820ms to 340ms by reworking N+1 queries
- Wrote load tests in k6 that caught a rate-limiting bug before it hit production

Software Engineer Intern | Toast
Boston, MA | May 2023 – Aug 2023
- Migrated a legacy order-sync job from polling to webhooks, reducing server load by ~30%
- Built an admin UI for managing restaurant menu overrides using React and TypeScript

PROJECTS
Splitwise CLI [Go, SQLite]
- Terminal app for splitting shared expenses; supports multiple currencies and even/uneven splits
- Stores history locally, exports to CSV

Trailhead [React Native, Firebase]
- Hiking trip planner with offline map caching and a trail-rating system
- ~200 active users as of last update

SKILLS
Go, TypeScript, Python, React, PostgreSQL, Redis, Docker, AWS (EC2/S3/Lambda)

LEADERSHIP & ACTIVITIES
Teaching Assistant | Fundamentals of Computer Science II
Northeastern University | Sep 2022 – Dec 2022
- Ran weekly lab sections and graded assignments for 60 students`;


export function ResumeEditor({ value, onChange }: ResumeEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        onChange(text);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="resume-editor">
      <div className="editor-toolbar">
        <label className="upload-btn">
          Upload .txt or .md
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.markdown,text/plain,text/markdown"
            onChange={handleFileUpload}
            hidden
          />
        </label>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => onChange(SAMPLE_RESUME)}
        >
          Load sample
        </button>
        <button
          type="button"
          className="toolbar-btn toolbar-btn--ghost"
          onClick={() => onChange('')}
        >
          Clear
        </button>
      </div>
      <textarea
        className="resume-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your resume here..."
        spellCheck={false}
      />
    </div>
  );
}
