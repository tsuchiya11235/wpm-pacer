"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError, listPassages } from "@/lib/api";
import type { PassageSummary } from "@/lib/types";

interface PassageHistoryListProps {
  /** Bump this to trigger a reload (e.g. after saving). */
  refreshKey: number;
  /** Called when the user picks a passage to re-open. */
  onSelect: (id: number) => void;
  /** Id currently loaded, highlighted in the list. */
  activeId: number | null;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

/**
 * Shows saved passages (newest first) fetched from the backend and lets the
 * user reload one into the reader.
 */
export default function PassageHistoryList({
  refreshKey,
  onSelect,
  activeId,
}: PassageHistoryListProps) {
  const [items, setItems] = useState<PassageSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listPassages());
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not load saved passages.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <section className="panel" aria-label="Saved passages">
      <div className="panel__header">
        <h2 className="panel__title">Saved passages</h2>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {!error && items.length === 0 && !loading && (
        <p className="status">No saved passages yet. Read and save one!</p>
      )}

      <ul className="history-list">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={
                "history-item" + (item.id === activeId ? " history-item--active" : "")
              }
              onClick={() => onSelect(item.id)}
            >
              <span className="history-item__title">{item.title}</span>
              <span className="history-item__meta">
                {item.sourceType} · {item.wpm} WPM · {formatDate(item.createdAt)}
              </span>
              <span className="history-item__preview">{item.preview}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
