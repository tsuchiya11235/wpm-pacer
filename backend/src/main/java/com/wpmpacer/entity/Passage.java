package com.wpmpacer.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/**
 * A saved piece of English text the user read (or intends to read) with the
 * pacer, together with the WPM it was read at and how it was entered.
 *
 * <p>The schema is created by the Flyway migration
 * {@code V1__create_passages_table.sql}; Hibernate is configured to validate
 * (not generate) against it in the PostgreSQL profile.
 */
@Entity
@Table(name = "passages")
public class Passage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Optional short label; defaults to a snippet of the content when blank. */
    @Column(name = "title", length = 120)
    private String title;

    @Column(name = "content", nullable = false, columnDefinition = "text")
    private String content;

    @Column(name = "wpm", nullable = false)
    private int wpm;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 16)
    private SourceType sourceType;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Passage() {
        // Required by JPA.
    }

    public Passage(String title, String content, int wpm, SourceType sourceType) {
        this.title = title;
        this.content = content;
        this.wpm = wpm;
        this.sourceType = sourceType;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public int getWpm() {
        return wpm;
    }

    public void setWpm(int wpm) {
        this.wpm = wpm;
    }

    public SourceType getSourceType() {
        return sourceType;
    }

    public void setSourceType(SourceType sourceType) {
        this.sourceType = sourceType;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
