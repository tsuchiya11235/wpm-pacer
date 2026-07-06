/** How the current text was entered. Mirrors the backend `SourceType` enum. */
export type SourceType = "MANUAL" | "PASTE" | "FILE" | "OCR";

/** Full passage as returned by the backend detail/create endpoints. */
export interface Passage {
  id: number;
  title: string;
  content: string;
  wpm: number;
  sourceType: SourceType;
  createdAt: string;
}

/** Lightweight passage summary used by the history list. */
export interface PassageSummary {
  id: number;
  title: string;
  preview: string;
  wpm: number;
  sourceType: SourceType;
  createdAt: string;
}

/** Request body for creating a passage. */
export interface CreatePassageInput {
  title?: string;
  content: string;
  wpm: number;
  sourceType: SourceType;
}

/** Result of an OCR extraction. */
export interface OcrResult {
  text: string;
  characterCount: number;
}
