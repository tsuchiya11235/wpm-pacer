package com.wpmpacer.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * CORS configuration bound from {@code wpm-pacer.cors.*}. The frontend runs on
 * a different origin (localhost:3000) during development, so allowed origins
 * are configurable per environment.
 *
 * @param allowedOrigins comma-separated list of permitted frontend origins
 */
@ConfigurationProperties(prefix = "wpm-pacer.cors")
public record CorsProperties(String allowedOrigins) {

    public CorsProperties {
        if (allowedOrigins == null || allowedOrigins.isBlank()) {
            allowedOrigins = "http://localhost:3000";
        }
    }

    public String[] originsArray() {
        return allowedOrigins.split("\\s*,\\s*");
    }
}
