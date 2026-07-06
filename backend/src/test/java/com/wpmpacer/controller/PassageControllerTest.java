package com.wpmpacer.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wpmpacer.dto.CreatePassageRequest;
import com.wpmpacer.dto.PassageResponse;
import com.wpmpacer.dto.PassageSummaryResponse;
import com.wpmpacer.entity.SourceType;
import com.wpmpacer.service.PassageService;

@WebMvcTest(PassageController.class)
class PassageControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PassageService passageService;

    @Test
    void createReturns201WithLocationHeader() throws Exception {
        PassageResponse response = new PassageResponse(
                42L, "title", "hello world", 300, SourceType.MANUAL, Instant.now());
        given(passageService.create(any(CreatePassageRequest.class))).willReturn(response);

        CreatePassageRequest request = new CreatePassageRequest(
                "title", "hello world", 300, SourceType.MANUAL);

        mockMvc.perform(post("/api/passages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/passages/42"))
                .andExpect(jsonPath("$.id").value(42))
                .andExpect(jsonPath("$.sourceType").value("MANUAL"));
    }

    @Test
    void createReturns400WhenContentBlank() throws Exception {
        CreatePassageRequest request = new CreatePassageRequest(
                null, "   ", 300, SourceType.MANUAL);

        mockMvc.perform(post("/api/passages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createReturns400WhenWpmOutOfRange() throws Exception {
        CreatePassageRequest request = new CreatePassageRequest(
                null, "some text", 5, SourceType.MANUAL);

        mockMvc.perform(post("/api/passages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listReturnsSummaries() throws Exception {
        given(passageService.listNewestFirst()).willReturn(List.of(
                new PassageSummaryResponse(2L, "b", "beta", 200, SourceType.OCR, Instant.now()),
                new PassageSummaryResponse(1L, "a", "alpha", 200, SourceType.MANUAL, Instant.now())));

        mockMvc.perform(get("/api/passages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(2));
    }

    @Test
    void getByIdReturnsPassage() throws Exception {
        given(passageService.getById(7L)).willReturn(new PassageResponse(
                7L, "t", "content here", 400, SourceType.FILE, Instant.now()));

        mockMvc.perform(get("/api/passages/7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.content").value("content here"));
    }
}
