package com.wpmpacer.dto;

import java.time.Instant;

import com.wpmpacer.entity.Passage;
import com.wpmpacer.entity.SourceType;

/**
 * Full representation of a saved passage returned by detail/create endpoints.
 */
public record PassageResponse(
        Long id,
        String title,
        String content,
        int wpm,
        SourceType sourceType,
        Instant createdAt) {

    public static PassageResponse from(Passage passage) {
        return new PassageResponse(
                passage.getId(),
                passage.getTitle(),
                passage.getContent(),
                passage.getWpm(),
                passage.getSourceType(),
                passage.getCreatedAt());
    }
}
