package com.wpmpacer.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Enables cross-origin requests from the Next.js frontend to the REST API.
 *
 * <p>Allowed origins come from {@code wpm-pacer.cors.allowed-origins} (a
 * comma-separated list) so they can be tuned per environment. Injected via
 * {@code @Value} rather than a bean so this configurer also works cleanly in
 * sliced {@code @WebMvcTest} contexts.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String[] allowedOrigins;

    public WebConfig(
            @Value("${wpm-pacer.cors.allowed-origins:http://localhost:3000}")
            String allowedOrigins) {
        this.allowedOrigins = allowedOrigins.split("\\s*,\\s*");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false)
                .maxAge(3600);
    }
}
