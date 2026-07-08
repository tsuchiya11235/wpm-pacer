package com.wpmpacer.dto;

import com.wpmpacer.entity.SourceType;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request body for {@code POST /api/passages}.
 *
 * @param title      optional label; a snippet of the content is used when blank
 * @param content    the English text to save (required)
 * @param wpm        reading pace in words per minute (30–1500)
 * @param sourceType how the text was entered (MANUAL/PASTE/FILE/OCR)
 */
public record CreatePassageRequest(
        @Size(max = 120, message = "title must be at most 120 characters")
        String title,

        @NotBlank(message = "content must not be blank")
        String content,

        @Min(value = 30, message = "wpm must be at least 30")
        @Max(value = 1500, message = "wpm must be at most 1500")
        int wpm,

        @NotNull(message = "sourceType is required")
        SourceType sourceType) {
}
