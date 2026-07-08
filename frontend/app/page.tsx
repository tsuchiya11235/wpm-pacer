"use client";

import { useState } from "react";

import AccordionItem from "@/components/AccordionItem";
import FileImportControl from "@/components/FileImportControl";
import OcrUploadPanel from "@/components/OcrUploadPanel";
import ReadingStage from "@/components/ReadingStage";
import TextInputPanel from "@/components/TextInputPanel";
import WpmControl from "@/components/WpmControl";
import { countWords } from "@/lib/text";

const DEFAULT_WPM = 300;

/** Builds a timestamped, filesystem-safe filename for the text download. */
function downloadFilename(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `wpm-pacer-${timestamp}.txt`;
}

export default function Home() {
  const [text, setText] = useState("");
  const [wpm, setWpm] = useState(DEFAULT_WPM);

  const handleDownload = () => {
    if (text.trim().length === 0) {
      return;
    }
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = downloadFilename();
    link.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = countWords(text);
  const canDownload = wordCount > 0;

  return (
    <main className="page">
      <header className="page__header">
        <h1 className="page__title">wpm_pacer</h1>
        <p className="page__subtitle">
          Read English text at your chosen words-per-minute pace, with
          progressive highlighting.
        </p>
        <div className="page__wpm">
          <WpmControl value={wpm} onChange={setWpm} />
        </div>
      </header>

      <div className="layout">
        <aside className="layout__col">
          <nav className="input-menu" aria-label="Text input methods">
            <AccordionItem
              title="1. Enter text"
              hint="Type or paste English text"
              defaultOpen
            >
              <TextInputPanel value={text} onValueChange={setText} />
            </AccordionItem>
            <AccordionItem title="2. Import a .txt file" hint="UTF-8 plain text">
              <FileImportControl onImport={setText} />
            </AccordionItem>
            <AccordionItem
              title="3. Extract from a photo (OCR)"
              hint="Upload an image, or capture one with your camera"
            >
              <OcrUploadPanel onExtract={setText} />
            </AccordionItem>
          </nav>

          <section className="panel" aria-label="Download passage">
            <div className="panel__header">
              <h2 className="panel__title">Download</h2>
              <p className="panel__hint">Save the current text as a .txt file</p>
            </div>
            <div className="row">
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleDownload}
                disabled={!canDownload}
              >
                Download as .txt
              </button>
            </div>
          </section>
        </aside>

        <div className="layout__col">
          <ReadingStage text={text} wpm={wpm} />
        </div>
      </div>
    </main>
  );
}
