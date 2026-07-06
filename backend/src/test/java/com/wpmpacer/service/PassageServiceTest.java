package com.wpmpacer.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import com.wpmpacer.dto.CreatePassageRequest;
import com.wpmpacer.dto.PassageResponse;
import com.wpmpacer.dto.PassageSummaryResponse;
import com.wpmpacer.entity.SourceType;
import com.wpmpacer.exception.ResourceNotFoundException;

/**
 * Persistence-level tests for {@link PassageService} against in-memory H2.
 */
@DataJpaTest
@Import(PassageService.class)
class PassageServiceTest {

    @Autowired
    private PassageService passageService;

    @Test
    void createPersistsPassageAndReturnsGeneratedId() {
        CreatePassageRequest request = new CreatePassageRequest(
                "My title", "The quick brown fox", 300, SourceType.MANUAL);

        PassageResponse response = passageService.create(request);

        assertThat(response.id()).isNotNull();
        assertThat(response.title()).isEqualTo("My title");
        assertThat(response.content()).isEqualTo("The quick brown fox");
        assertThat(response.wpm()).isEqualTo(300);
        assertThat(response.sourceType()).isEqualTo(SourceType.MANUAL);
        assertThat(response.createdAt()).isNotNull();
    }

    @Test
    void createDerivesTitleFromContentWhenTitleBlank() {
        CreatePassageRequest request = new CreatePassageRequest(
                "   ", "Reading paces improve with practice", 250, SourceType.PASTE);

        PassageResponse response = passageService.create(request);

        assertThat(response.title()).isEqualTo("Reading paces improve with practice");
    }

    @Test
    void listReturnsNewestFirst() {
        passageService.create(new CreatePassageRequest("first", "alpha", 200, SourceType.MANUAL));
        passageService.create(new CreatePassageRequest("second", "beta", 200, SourceType.OCR));

        List<PassageSummaryResponse> summaries = passageService.listNewestFirst();

        assertThat(summaries).hasSize(2);
        assertThat(summaries.get(0).title()).isEqualTo("second");
        assertThat(summaries.get(1).title()).isEqualTo("first");
    }

    @Test
    void getByIdReturnsPassage() {
        PassageResponse created = passageService.create(
                new CreatePassageRequest("t", "gamma", 200, SourceType.FILE));

        PassageResponse fetched = passageService.getById(created.id());

        assertThat(fetched.content()).isEqualTo("gamma");
    }

    @Test
    void getByIdThrowsWhenMissing() {
        assertThatThrownBy(() -> passageService.getById(999_999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
