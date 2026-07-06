package com.wpmpacer.entity;

/**
 * How the text of a {@link Passage} was originally entered by the user.
 * Mirrors the four input methods offered by the frontend.
 */
public enum SourceType {
    /** Typed directly into the textarea. */
    MANUAL,
    /** Pasted from the clipboard. */
    PASTE,
    /** Imported from a local .txt file (read client-side). */
    FILE,
    /** Extracted from an image via OCR. */
    OCR
}
