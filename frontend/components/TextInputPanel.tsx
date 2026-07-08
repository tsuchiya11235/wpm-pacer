"use client";

import { type ChangeEvent } from "react";

import { countCharacters, countWords } from "@/lib/text";

interface TextInputPanelProps {
  value: string;
  onValueChange: (text: string) => void;
}

/**
 * The primary text entry surface: a textarea supporting manual typing and
 * copy/paste. Shows live word and character counts.
 */
export default function TextInputPanel({
  value,
  onValueChange,
}: TextInputPanelProps) {
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onValueChange(event.target.value);
  };

  const handleClear = () => {
    onValueChange("");
  };

  const words = countWords(value);
  const characters = countCharacters(value);

  return (
    <div aria-label="Text input">
      <textarea
        className="textarea"
        value={value}
        onChange={handleChange}
        placeholder="Type here, or paste text from your clipboard…"
        aria-label="Reading text"
        spellCheck={false}
      />

      <div className="row" style={{ marginTop: "0.5rem" }}>
        <span className="counts">
          {words} {words === 1 ? "word" : "words"} · {characters} characters
        </span>
        <span className="spacer" />
        <button
          type="button"
          className="btn btn--ghost"
          onClick={handleClear}
          disabled={value.length === 0}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
