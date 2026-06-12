interface EntryBlockProps {
  title: string;
  subtitle?: string;
  meta?: string;
  bullets?: string[];
}

export function EntryBlock({ title, subtitle, meta, bullets }: EntryBlockProps) {
  return (
    <div className="resume-entry">
      <div className="entry-header">
        <div className="entry-left">
          <span className="entry-title">{title}</span>
          {subtitle && (
            <>
              {', '}
              <span className="entry-subtitle">{subtitle}</span>
            </>
          )}
        </div>
        {meta && <div className="entry-meta">{meta}</div>}
      </div>
      {bullets && bullets.length > 0 && (
        <ul className="entry-bullets">
          {bullets.map((bullet, index) => (
            <li key={index}>{bullet}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
