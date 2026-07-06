package com.wpmpacer.dto;

import java.time.Instant;

import com.wpmpacer.entity.Passage;
import com.wpmpacer.entity.SourceType;

/**
 * Lightweight representation for the history list. Includes a short preview
 * instead of the full content to keep list payloads small.
 */
public record PassageSummaryResponse(
        Long id,
        String title,
        String preview,
        int wpm,
        SourceType sourceType,
        Instant createdAt) {

    private static final int PREVIEW_LENGTH = 80;

    public static PassageSummaryResponse from(Passage passage) {
        return new PassageSummaryResponse(
                passage.getId(),
                passage.getTitle(),
                buildPreview(passage.getContent()),
                passage.getWpm(),
                passage.getSourceType(),
                passage.getCreatedAt());
    }

    private static String buildPreview(String content) {
        if (content == null) {
            return "";
        }
        String normalized = content.strip().replaceAll("\\s+", " ");
        if (normalized.length() <= PREVIEW_LENGTH) {
            return normalized;
        }
        return normalized.substring(0, PREVIEW_LENGTH) + "…";
    }
}
