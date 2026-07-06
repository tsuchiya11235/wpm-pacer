package com.wpmpacer.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wpmpacer.entity.Passage;

/**
 * Spring Data JPA repository for {@link Passage}. Standard CRUD plus a
 * newest-first listing used by the history panel.
 */
public interface PassageRepository extends JpaRepository<Passage, Long> {

    List<Passage> findAllByOrderByCreatedAtDesc();
}
