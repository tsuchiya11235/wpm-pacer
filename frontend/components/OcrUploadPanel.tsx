"use client";

import Image from "next/image";
import {
  useEffect,
  useState,
  type ChangeEvent,
} from "react";

import { ApiError, extractOcr } from "@/lib/api";

interface OcrUploadPanelProps {
  /** Called with recognised text so the parent can put it in the textarea. */
  onExtract: (text: string) => void;
}

/**
 * Uploads a photo to the backend OCR endpoint and feeds the recognised text
 * back to the editable textarea. Shows a preview, a loading state during
 * extraction, and clear error messages (OCR is imperfect, so the user always
 * gets to review/correct the result upstream).
 */
export default function OcrUploadPanel({ onExtract }: OcrUploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Keep the object URL in sync with the selected file and revoke it on change.
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleSelect = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setStatus(null);
    const selected = event.target.files?.[0] ?? null;
    if (selected && !selected.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPEG, etc.).");
      setFile(null);
      return;
    }
    setFile(selected);
  };

  const handleExtract = async () => {
    if (!file) {
      return;
    }
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const result = await extractOcr(file);
      if (result.text.trim().length === 0) {
        setStatus("No text was found in the image. Try a clearer photo.");
        return;
      }
      onExtract(result.text);
      setStatus(
        `Extracted ${result.characterCount} characters. Review and edit above.`,
      );
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "OCR failed unexpectedly. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div aria-label="Extract text from image (OCR)">
      <input
        className="file-input"
        type="file"
        accept="image/*"
        onChange={handleSelect}
        aria-label="Choose an image"
        disabled={loading}
      />

      {previewUrl && (
        <div style={{ marginTop: "0.75rem" }}>
          {/* Unoptimised: the source is a transient client-side object URL. */}
          <Image
            src={previewUrl}
            alt="Selected image preview"
            width={320}
            height={200}
            unoptimized
            style={{
              maxWidth: "100%",
              height: "auto",
              borderRadius: 8,
              border: "1px solid var(--border)",
            }}
          />
        </div>
      )}

      <div className="row" style={{ marginTop: "0.75rem" }}>
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleExtract}
          disabled={!file || loading}
        >
          {loading ? "Extracting…" : "Extract text"}
        </button>
      </div>

      {status && <p className="status">{status}</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
