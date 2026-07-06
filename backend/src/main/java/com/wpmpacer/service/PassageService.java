package com.wpmpacer.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.wpmpacer.dto.CreatePassageRequest;
import com.wpmpacer.dto.PassageResponse;
import com.wpmpacer.dto.PassageSummaryResponse;
import com.wpmpacer.entity.Passage;
import com.wpmpacer.exception.ResourceNotFoundException;
import com.wpmpacer.repository.PassageRepository;

/**
 * Application logic for creating and retrieving {@link Passage} records.
 * Controllers stay thin; all persistence and mapping happens here.
 */
@Service
@Transactional(readOnly = true)
public class PassageService {

    private static final int DERIVED_TITLE_MAX = 60;

    private final PassageRepository passageRepository;

    public PassageService(PassageRepository passageRepository) {
        this.passageRepository = passageRepository;
    }

    @Transactional
    public PassageResponse create(CreatePassageRequest request) {
        String title = resolveTitle(request.title(), request.content());
        Passage passage = new Passage(
                title,
                request.content(),
                request.wpm(),
                request.sourceType());
        Passage saved = passageRepository.save(passage);
        return PassageResponse.from(saved);
    }

    public List<PassageSummaryResponse> listNewestFirst() {
        return passageRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(PassageSummaryResponse::from)
                .toList();
    }

    public PassageResponse getById(Long id) {
        Passage passage = passageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Passage not found: id=" + id));
        return PassageResponse.from(passage);
    }

    /**
     * Uses the supplied title when present, otherwise derives a readable label
     * from the first words of the content so the history list is never blank.
     */
    private String resolveTitle(String title, String content) {
        if (title != null && !title.isBlank()) {
            return title.strip();
        }
        String normalized = content.strip().replaceAll("\\s+", " ");
        if (normalized.length() <= DERIVED_TITLE_MAX) {
            return normalized;
        }
        return normalized.substring(0, DERIVED_TITLE_MAX).stripTrailing() + "…";
    }
}
