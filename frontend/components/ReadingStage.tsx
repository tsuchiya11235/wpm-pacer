"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import { usePacer } from "@/hooks/usePacer";
import { countWords, tokenize } from "@/lib/text";

interface ReadingStageProps {
  text: string;
  wpm: number;
}

const STATUS_LABEL: Record<string, string> = {
  idle: "Ready",
  playing: "Reading…",
  paused: "Paused",
  finished: "Done",
};

const DEFAULT_HIGHLIGHT_COLOR = "#facc15";

/**
 * Renders the passage and progressively highlights it word-by-word at the
 * chosen WPM. Highlighting uses the native Selection API together with the
 * `::selection` CSS rule (per the product spec): on every frame we select the
 * text from the start through the current word, and CSS colours that selection.
 */
export default function ReadingStage({ text, wpm }: ReadingStageProps) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [highlightColor, setHighlightColor] = useState(DEFAULT_HIGHLIGHT_COLOR);

  const tokens = useMemo(() => {
    // Reset refs whenever the text changes so indices stay aligned.
    wordRefs.current = [];
    return tokenize(text);
  }, [text]);

  const totalWords = useMemo(() => countWords(text), [text]);

  const { status, readCount, isPlaying, reset, toggle } = usePacer({
    totalWords,
    wpm,
  });

  // Apply the selection highlight for the current read position.
  useEffect(() => {
    const container = containerRef.current;
    const selection =
      typeof window !== "undefined" ? window.getSelection() : null;
    if (!container || !selection) {
      return;
    }
    // Don't touch the document selection while the user is focused on a
    // text-editing control elsewhere on the page (e.g. typing in the input
    // textarea) - doing so on every keystroke would fight the browser's own
    // caret handling there and make that field unusable.
    const active = document.activeElement;
    const isEditingElsewhere =
      active instanceof HTMLElement &&
      active !== container &&
      (active.tagName === "TEXTAREA" ||
        active.tagName === "INPUT" ||
        active.isContentEditable);
    if (isEditingElsewhere) {
      return;
    }
    if (readCount <= 0) {
      selection.removeAllRanges();
      return;
    }
    const lastWord = wordRefs.current[readCount - 1];
    if (!lastWord) {
      return;
    }
    const range = document.createRange();
    range.setStart(container, 0);
    range.setEndAfter(lastWord);
    selection.removeAllRanges();
    selection.addRange(range);
  }, [readCount, tokens]);

  const hasText = totalWords > 0;
  const progressPct = hasText ? Math.round((readCount / totalWords) * 100) : 0;

  return (
    <section className="panel reading-stage-panel" aria-label="Reading stage">
      <div className="panel__header">
        <h2 className="panel__title">Reading stage</h2>
        <p className="panel__hint">
          {STATUS_LABEL[status]} · {readCount}/{totalWords} words · {progressPct}
          %
        </p>
      </div>

      <div className="row" style={{ marginBottom: "0.75rem" }}>
        <button
          type="button"
          className="btn btn--primary"
          onClick={toggle}
          disabled={!hasText}
        >
          {isPlaying ? "Pause" : status === "paused" ? "Resume" : "Start"}
        </button>
        <button
          type="button"
          className="btn"
          onClick={reset}
          disabled={!hasText || (status === "idle" && readCount === 0)}
        >
          Reset
        </button>
        <label className="row" style={{ gap: "0.4rem" }}>
          <span className="counts">Highlight color</span>
          <input
            type="color"
            value={highlightColor}
            onChange={(e) => setHighlightColor(e.target.value)}
            aria-label="Highlight color"
            className="color-input"
          />
        </label>
        <span className="spacer" />
        <span className="counts">{wpm} WPM</span>
      </div>

      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPct}
      >
        <div className="progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      {hasText ? (
        <p
          ref={containerRef}
          className="reading-stage"
          lang="en"
          style={{ "--highlight-bg": highlightColor } as CSSProperties}
        >
          {tokens.map((token, i) =>
            token.isWord ? (
              <span
                key={i}
                ref={(el) => {
                  wordRefs.current[token.wordIndex] = el;
                }}
              >
                {token.text}
              </span>
            ) : (
              <span key={i}>{token.text}</span>
            ),
          )}
        </p>
      ) : (
        <p className="status">
          Enter or import some text above to start reading.
        </p>
      )}
    </section>
  );
}
