"use client";

import { forwardRef, type ChangeEvent, type SyntheticEvent } from "react";

import { countCharacters, countWords } from "@/lib/text";

interface TextInputPanelProps {
  value: string;
  onValueChange: (text: string) => void;
  /** Reports the caret position whenever it changes, so file/OCR imports
   * elsewhere in the app know where to insert their text. */
  onCursorChange?: (position: number) => void;
}

/**
 * The primary text entry surface: a textarea supporting manual typing and
 * copy/paste. Shows live word and character counts. The underlying
 * `<textarea>` DOM node is forwarded so the parent can programmatically move
 * the caret after inserting text from another input method.
 */
const TextInputPanel = forwardRef<HTMLTextAreaElement, TextInputPanelProps>(
  function TextInputPanel({ value, onValueChange, onCursorChange }, ref) {
    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
      onValueChange(event.target.value);
    };

    const reportCursor = (event: SyntheticEvent<HTMLTextAreaElement>) => {
      onCursorChange?.(event.currentTarget.selectionStart);
    };

    const handleClear = () => {
      onValueChange("");
    };

    const words = countWords(value);
    const characters = countCharacters(value);

    return (
      <div aria-label="Text input">
        <textarea
          ref={ref}
          className="textarea"
          value={value}
          onChange={handleChange}
          onSelect={reportCursor}
          onClick={reportCursor}
          onKeyUp={reportCursor}
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
  },
);

export default TextInputPanel;
