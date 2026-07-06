"use client";

import { useState } from "react";

import FileImportControl from "@/components/FileImportControl";
import OcrUploadPanel from "@/components/OcrUploadPanel";
import PassageHistoryList from "@/components/PassageHistoryList";
import ReadingStage from "@/components/ReadingStage";
import TextInputPanel from "@/components/TextInputPanel";
import WpmControl from "@/components/WpmControl";
import { ApiError, createPassage, getPassage } from "@/lib/api";
import { countWords } from "@/lib/text";
import type { SourceType } from "@/lib/types";

const DEFAULT_WPM = 300;

export default function Home() {
  const [text, setText] = useState("");
  const [wpm, setWpm] = useState(DEFAULT_WPM);
  const [sourceType, setSourceType] = useState<SourceType>("MANUAL");
  const [title, setTitle] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeId, setActiveId] = useState<number | null>(null);

  const handleTextChange = (next: string, source: SourceType) => {
    setText(next);
    setSourceType(source);
    setActiveId(null);
  };

  const handleImport = (next: string, source: SourceType) => {
    setText(next);
    setSourceType(source);
    setActiveId(null);
    setSaveStatus(null);
  };

  const handleSave = async () => {
    if (text.trim().length === 0) {
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveStatus(null);
    try {
      const saved = await createPassage({
        title: title.trim() || undefined,
        content: text,
        wpm,
        sourceType,
      });
      setActiveId(saved.id);
      setSaveStatus(`Saved as “${saved.title}”.`);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Could not save the passage.";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectPassage = async (id: number) => {
    setSaveError(null);
    setSaveStatus(null);
    try {
      const passage = await getPassage(id);
      setText(passage.content);
      setWpm(passage.wpm);
      setSourceType(passage.sourceType);
      setTitle(passage.title);
      setActiveId(passage.id);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Could not open the passage.";
      setSaveError(message);
    }
  };

  const wordCount = countWords(text);
  const canSave = wordCount > 0 && !saving;

  return (
    <main className="page">
      <header className="page__header">
        <h1 className="page__title">wpm_pacer</h1>
        <p className="page__subtitle">
          Read English text at your chosen words-per-minute pace, with
          progressive highlighting.
        </p>
      </header>

      <div className="layout">
        <div className="layout__col">
          <TextInputPanel value={text} onValueChange={handleTextChange} />
          <FileImportControl
            onImport={(imported) => handleImport(imported, "FILE")}
          />
          <OcrUploadPanel
            onExtract={(extracted) => handleImport(extracted, "OCR")}
          />
          <WpmControl value={wpm} onChange={setWpm} />

          <section className="panel" aria-label="Save passage">
            <div className="panel__header">
              <h2 className="panel__title">Save</h2>
              <p className="panel__hint">Persist this passage to revisit later</p>
            </div>
            <div className="row">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Optional title"
                aria-label="Passage title"
                className="title-input"
                maxLength={120}
              />
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => void handleSave()}
                disabled={!canSave}
              >
                {saving ? "Saving…" : "Save passage"}
              </button>
            </div>
            {saveStatus && <p className="status">{saveStatus}</p>}
            {saveError && (
              <p className="error" role="alert">
                {saveError}
              </p>
            )}
          </section>
        </div>

        <div className="layout__col">
          <ReadingStage text={text} wpm={wpm} />
          <PassageHistoryList
            refreshKey={refreshKey}
            onSelect={handleSelectPassage}
            activeId={activeId}
          />
        </div>
      </div>
    </main>
  );
}
