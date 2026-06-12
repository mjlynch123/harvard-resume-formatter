import type { ContactInfo } from '../../types/resume';

interface ContactHeaderProps {
  contact: ContactInfo;
}

export function ContactHeader({ contact }: ContactHeaderProps) {
  const contactParts = [
    contact.email,
    contact.phone,
    contact.location,
    contact.website,
    contact.github,
    contact.linkedin,
  ].filter(Boolean);

  return (
    <header className="resume-header">
      <h1 className="resume-name">{contact.name || 'Your Name'}</h1>
      {contactParts.length > 0 && (
        <p className="resume-contact">{contactParts.join(' | ')}</p>
      )}
    </header>
  );
}
