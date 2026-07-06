package com.wpmpacer.controller;

import java.time.Instant;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Lightweight liveness endpoint used by the frontend and by smoke tests to
 * confirm the backend is up. Intentionally dependency-free so it responds even
 * if the database is unavailable.
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
                "status", "UP",
                "service", "wpm_pacer",
                "timestamp", Instant.now().toString());
    }
}
