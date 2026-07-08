"use client";

import { type ChangeEvent } from "react";

import { clamp } from "@/lib/pacer";

interface WpmControlProps {
  value: number;
  onChange: (wpm: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const PRESETS = [200, 300, 400, 500];

/**
 * Sets the reading pace. A slider and a synced number input both feed the same
 * `onChange`, and because the parent owns the wpm state the reading stage picks
 * up changes live (mid-playback re-pacing is handled by usePacer).
 */
export default function WpmControl({
  value,
  onChange,
  min = 30,
  max = 1000,
  step = 10,
}: WpmControlProps) {
  const emit = (raw: number) => {
    if (Number.isNaN(raw)) {
      return;
    }
    onChange(clamp(Math.round(raw), min, max));
  };

  const handleSlider = (event: ChangeEvent<HTMLInputElement>) => {
    emit(Number(event.target.value));
  };

  const handleNumber = (event: ChangeEvent<HTMLInputElement>) => {
    emit(Number(event.target.value));
  };

  return (
    <section className="panel" aria-label="Reading speed">
      <div className="panel__header">
        <h2 className="panel__title">Reading speed</h2>
        <p className="panel__hint">Adjust anytime, even while reading</p>
      </div>

      <div className="row">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSlider}
          aria-label="WPM slider"
          style={{ flex: "1 1 240px" }}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleNumber}
          aria-label="WPM value"
          className="wpm-number"
        />
        <span className="counts">WPM</span>
      </div>

      <div className="row" style={{ marginTop: "0.75rem" }}>
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className="btn btn--ghost"
            onClick={() => emit(preset)}
            aria-pressed={value === preset}
          >
            {preset}
          </button>
        ))}
      </div>
    </section>
  );
}
