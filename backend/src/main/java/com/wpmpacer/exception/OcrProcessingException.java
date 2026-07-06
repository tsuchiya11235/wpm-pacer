package com.wpmpacer.exception;

/**
 * Thrown when OCR could not be performed (missing language data, native
 * engine failure, unreadable image). Mapped to HTTP 422 by
 * {@code GlobalExceptionHandler} so the frontend can prompt the user to retry
 * or edit manually.
 */
public class OcrProcessingException extends RuntimeException {

    public OcrProcessingException(String message, Throwable cause) {
        super(message, cause);
    }

    public OcrProcessingException(String message) {
        super(message);
    }
}
