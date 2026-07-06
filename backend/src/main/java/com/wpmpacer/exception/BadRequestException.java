package com.wpmpacer.exception;

/**
 * Thrown for client-side input problems (e.g. empty upload, unsupported file
 * type). Mapped to HTTP 400 by {@code GlobalExceptionHandler}.
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
