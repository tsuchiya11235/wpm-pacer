package com.wpmpacer.dto;

import java.time.Instant;
import java.util.List;

/**
 * Uniform error body returned by {@code GlobalExceptionHandler}.
 *
 * @param timestamp when the error occurred
 * @param status    HTTP status code
 * @param error     short HTTP reason phrase
 * @param message   human-readable explanation for the client
 * @param details   optional per-field validation messages (may be empty)
 */
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String message,
        List<String> details) {

    public static ApiError of(int status, String error, String message, List<String> details) {
        return new ApiError(Instant.now(), status, error, message,
                details == null ? List.of() : details);
    }
}
