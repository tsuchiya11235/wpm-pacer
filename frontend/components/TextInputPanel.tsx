"use client";

import { useRef, type ChangeEvent } from "react";

import { countCharacters, countWords } from "@/lib/text";
import type { SourceType } from "@/lib/types";

interface TextInputPanelProps {
  value: string;
  /**
   * Called whenever the text changes. `source` distinguishes typing (MANUAL)
   * from pasting (PASTE) so the saved passage records how it was entered.
   */
  onValueChange: (text: string, source: SourceType) => void;
}

/**
 * The primary text entry surface: a textarea supporting manual typing and
 * copy/paste. Shows live word and character counts.
 */
export default function TextInputPanel({
  value,
  onValueChange,
}: TextInputPanelProps) {
  // Set by the paste handler (which fires before onChange) so the change
  // handler can attribute the update to a paste rather than typing.
  const pastedRef = useRef(false);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const source: SourceType = pastedRef.current ? "PASTE" : "MANUAL";
    pastedRef.current = false;
    onValueChange(event.target.value, source);
  };

  const handlePaste = () => {
    pastedRef.current = true;
  };

  const handleClear = () => {
    onValueChange("", "MANUAL");
  };

  const words = countWords(value);
  const characters = countCharacters(value);

  return (
    <div aria-label="Text input">
      <textarea
        className="textarea"
        value={value}
        onChange={handleChange}
        onPaste={handlePaste}
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
