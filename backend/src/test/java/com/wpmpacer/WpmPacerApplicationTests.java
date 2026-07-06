package com.wpmpacer;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Smoke test: the full application context (controllers, services, JPA,
 * config properties, CORS, exception handling) wires up successfully against
 * the in-memory H2 test datasource.
 */
@SpringBootTest
class WpmPacerApplicationTests {

    @Test
    void contextLoads() {
    }
}
