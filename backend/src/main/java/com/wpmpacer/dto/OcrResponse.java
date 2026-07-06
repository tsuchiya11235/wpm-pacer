package com.wpmpacer.dto;

/**
 * Result of an OCR extraction returned by {@code POST /api/ocr}.
 *
 * @param text          the recognised text (may be empty if nothing was found)
 * @param characterCount convenience count so the frontend can hint at quality
 */
public record OcrResponse(String text, int characterCount) {

    public static OcrResponse of(String text) {
        String safe = text == null ? "" : text;
        return new OcrResponse(safe, safe.length());
    }
}
