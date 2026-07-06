"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  isComplete,
  readWordCount,
  reanchor,
  type PacerAnchor,
} from "@/lib/pacer";

export type PacerStatus = "idle" | "playing" | "paused" | "finished";

interface UsePacerOptions {
  totalWords: number;
  wpm: number;
}

export interface UsePacerResult {
  status: PacerStatus;
  /** Number of words highlighted so far (0..totalWords). */
  readCount: number;
  isPlaying: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  toggle: () => void;
}

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

/**
 * Drives the reading pacer. Uses `requestAnimationFrame` for smooth updates but
 * derives progress purely from timestamps (see lib/pacer), so background-tab
 * throttling cannot cause the highlight to drift. Supports start/pause/reset and
 * live WPM changes (which re-anchor to preserve the current position).
 */
export function usePacer({ totalWords, wpm }: UsePacerOptions): UsePacerResult {
  const [status, setStatus] = useState<PacerStatus>("idle");
  const [readCount, setReadCount] = useState(0);

  const anchorRef = useRef<PacerAnchor>({ wordsAtAnchor: 0, anchorMs: now() });
  const statusRef = useRef<PacerStatus>("idle");
  const wpmRef = useRef(wpm);
  const totalWordsRef = useRef(totalWords);
  const rafRef = useRef<number | null>(null);

  const setStatusBoth = useCallback((next: PacerStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const count = readWordCount(
      anchorRef.current,
      now(),
      wpmRef.current,
      totalWordsRef.current,
    );
    setReadCount(count);

    if (isComplete(count, totalWordsRef.current)) {
      anchorRef.current = {
        wordsAtAnchor: totalWordsRef.current,
        anchorMs: now(),
      };
      stopLoop();
      setStatusBoth("finished");
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [setStatusBoth, stopLoop]);

  const start = useCallback(() => {
    if (totalWordsRef.current === 0 || statusRef.current === "playing") {
      return;
    }
    // Restart from the beginning if the previous run finished.
    if (statusRef.current === "finished") {
      anchorRef.current = { wordsAtAnchor: 0, anchorMs: now() };
      setReadCount(0);
    } else {
      // Resume: re-anchor time to now, keeping accumulated word progress.
      anchorRef.current = { ...anchorRef.current, anchorMs: now() };
    }
    setStatusBoth("playing");
    stopLoop();
    rafRef.current = requestAnimationFrame(tick);
  }, [setStatusBoth, stopLoop, tick]);

  const pause = useCallback(() => {
    if (statusRef.current !== "playing") {
      return;
    }
    // Freeze progress by folding elapsed time into the anchor.
    anchorRef.current = reanchor(anchorRef.current, now(), wpmRef.current);
    stopLoop();
    setStatusBoth("paused");
  }, [setStatusBoth, stopLoop]);

  const reset = useCallback(() => {
    stopLoop();
    anchorRef.current = { wordsAtAnchor: 0, anchorMs: now() };
    setReadCount(0);
    setStatusBoth("idle");
  }, [setStatusBoth, stopLoop]);

  const toggle = useCallback(() => {
    if (statusRef.current === "playing") {
      pause();
    } else {
      start();
    }
  }, [pause, start]);

  // Keep totalWords in sync and reset when the text changes.
  useEffect(() => {
    totalWordsRef.current = totalWords;
    reset();
  }, [totalWords, reset]);

  // Handle live WPM changes: re-anchor using the *previous* pace so the current
  // position is preserved, then adopt the new pace for subsequent ticks.
  useEffect(() => {
    if (statusRef.current === "playing") {
      anchorRef.current = reanchor(anchorRef.current, now(), wpmRef.current);
    }
    wpmRef.current = wpm;
  }, [wpm]);

  // Cancel any pending frame on unmount.
  useEffect(() => stopLoop, [stopLoop]);

  return {
    status,
    readCount,
    isPlaying: status === "playing",
    start,
    pause,
    reset,
    toggle,
  };
}
