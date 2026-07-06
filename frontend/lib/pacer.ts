/**
 * Pure timing logic for the reading pacer. Kept free of React and the DOM so
 * it can be unit-tested deterministically.
 *
 * The design is timestamp-based (not tick-counting) so that a throttled or
 * backgrounded tab cannot cause drift: the number of words read is always a
 * function of elapsed wall-clock time, recomputed from an anchor.
 */

/**
 * A fixed point in the reading timeline: how many words had been read
 * (`wordsAtAnchor`, may be fractional) at a given timestamp (`anchorMs`).
 * A new anchor is taken on play, and whenever the WPM changes mid-play, so the
 * fractional progress carries over to the new pace.
 */
export interface PacerAnchor {
  wordsAtAnchor: number;
  anchorMs: number;
}

/** Milliseconds each word should occupy at the given pace. */
export function msPerWord(wpm: number): number {
  if (wpm <= 0) {
    throw new Error("wpm must be positive");
  }
  return 60000 / wpm;
}

/** Fractional number of words covered by `elapsedMs` at `wpm`. */
export function wordsElapsed(elapsedMs: number, wpm: number): number {
  if (elapsedMs <= 0) {
    return 0;
  }
  return elapsedMs / msPerWord(wpm);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Exact (fractional, unclamped) word progress at `nowMs`, given the anchor and
 * current pace. Used when re-anchoring on a WPM change to preserve position.
 */
export function exactWordCount(
  anchor: PacerAnchor,
  nowMs: number,
  wpm: number,
): number {
  return anchor.wordsAtAnchor + wordsElapsed(nowMs - anchor.anchorMs, wpm);
}

/**
 * Number of whole words that should be highlighted at `nowMs`, clamped to
 * `[0, totalWords]`. This is the value the reading stage renders.
 */
export function readWordCount(
  anchor: PacerAnchor,
  nowMs: number,
  wpm: number,
  totalWords: number,
): number {
  const exact = exactWordCount(anchor, nowMs, wpm);
  return clamp(Math.floor(exact), 0, totalWords);
}

/**
 * Produces a new anchor at `nowMs` that preserves the current fractional
 * progress. Call this when starting from a paused position or when the WPM
 * changes during playback (pass the *old* wpm so progress is measured on the
 * pace that was actually in effect).
 */
export function reanchor(
  anchor: PacerAnchor,
  nowMs: number,
  wpm: number,
): PacerAnchor {
  return {
    wordsAtAnchor: exactWordCount(anchor, nowMs, wpm),
    anchorMs: nowMs,
  };
}

/** True once every word has been read. */
export function isComplete(readCount: number, totalWords: number): boolean {
  return totalWords > 0 && readCount >= totalWords;
}
