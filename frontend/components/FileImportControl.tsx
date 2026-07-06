"use client";

import { useRef, useState, type ChangeEvent } from "react";

interface FileImportControlProps {
  /** Called with the file's text content once it has been read. */
  onImport: (text: string) => void;
}

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB is plenty for plain-text passages.

/**
 * Imports a local `.txt` file into the reading text using the FileReader API.
 * Runs entirely client-side (no backend call). Guards against non-text files,
 * oversized files, and read failures with inline error messages.
 */
export default function FileImportControl({
  onImport,
}: FileImportControlProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedName, setLoadedName] = useState<string | null>(null);

  const reset = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setLoadedName(null);

    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const isTxt =
      file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt");
    if (!isTxt) {
      setError("Only .txt plain-text files are supported.");
      reset();
      return;
    }

    if (file.size > MAX_BYTES) {
      setError("File is too large (max 2 MB).");
      reset();
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setError("Could not read the file. Please try again.");
      reset();
    };
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        setError("Unexpected file contents.");
        reset();
        return;
      }
      setLoadedName(file.name);
      onImport(result);
      reset();
    };
    reader.readAsText(file, "UTF-8");
  };

  return (
    <section className="panel" aria-label="Import from file">
      <div className="panel__header">
        <h2 className="panel__title">2. Import a .txt file</h2>
        <p className="panel__hint">UTF-8 plain text</p>
      </div>

      <input
        ref={inputRef}
        className="file-input"
        type="file"
        accept=".txt,text/plain"
        onChange={handleChange}
        aria-label="Choose a .txt file"
      />

      {loadedName && (
        <p className="status">Loaded “{loadedName}” into the text box.</p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
