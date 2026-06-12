import { useMemo, useRef, useState } from 'react';
import './App.css';
import { ExportButtons } from './components/ExportButtons';
import { ResumeEditor } from './components/ResumeEditor';
import { ResumePreview } from './components/ResumePreview';
import { parseResume } from './utils/parseResume';

function App() {
  const [rawText, setRawText] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  const parsedResume = useMemo(() => parseResume(rawText), [rawText]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Harvard Resume Formatter</h1>
        <p>Paste your resume in on the left, get a clean Harvard-style layout on the right.</p>
      </header>

      <main className="app-main">
        <div className="app-layout">
          <section className="panel editor-panel">
            <div className="panel-header">
              <h2>Your Resume</h2>
            </div>
            <div className="panel-body">
              <ResumeEditor value={rawText} onChange={setRawText} />
            </div>
          </section>

          <section className="panel preview-panel">
            <div className="panel-header">
              <h2>Harvard-Style Preview</h2>
            </div>
            <div className="panel-body">
              <ResumePreview ref={previewRef} resume={parsedResume} />
              <ExportButtons resume={parsedResume} previewRef={previewRef} />
            </div>
          </section>
        </div>
      </main>

      <footer className="app-footer">
        Runs entirely in your browser — nothing is sent anywhere.
      </footer>
    </div>
  );
}

export default App;
