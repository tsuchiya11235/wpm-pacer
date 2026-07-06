package com.wpmpacer.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.wpmpacer.dto.CreatePassageRequest;
import com.wpmpacer.dto.PassageResponse;
import com.wpmpacer.dto.PassageSummaryResponse;
import com.wpmpacer.service.PassageService;

import jakarta.validation.Valid;

/**
 * REST endpoints for saving and retrieving passages.
 *
 * <ul>
 *   <li>{@code POST /api/passages} – save a passage</li>
 *   <li>{@code GET  /api/passages} – list summaries, newest first</li>
 *   <li>{@code GET  /api/passages/{id}} – fetch full passage</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/passages")
public class PassageController {

    private final PassageService passageService;

    public PassageController(PassageService passageService) {
        this.passageService = passageService;
    }

    @PostMapping
    public ResponseEntity<PassageResponse> create(
            @Valid @RequestBody CreatePassageRequest request) {
        PassageResponse created = passageService.create(request);
        return ResponseEntity
                .created(URI.create("/api/passages/" + created.id()))
                .body(created);
    }

    @GetMapping
    public List<PassageSummaryResponse> list() {
        return passageService.listNewestFirst();
    }

    @GetMapping("/{id}")
    public PassageResponse getById(@PathVariable Long id) {
        return passageService.getById(id);
    }
}
