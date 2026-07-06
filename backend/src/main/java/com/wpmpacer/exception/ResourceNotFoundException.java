package com.wpmpacer.exception;

/**
 * Thrown when a requested resource (e.g. a passage) does not exist. Mapped to
 * HTTP 404 by {@code GlobalExceptionHandler}.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
