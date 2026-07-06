package com.wpmpacer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the wpm_pacer backend.
 *
 * <p>Provides Passage persistence (JPA + Flyway on PostgreSQL) and an OCR
 * endpoint (Tess4J). The frontend (Next.js) consumes these over REST.
 */
@SpringBootApplication
public class WpmPacerApplication {

    public static void main(String[] args) {
        SpringApplication.run(WpmPacerApplication.class, args);
    }
}
