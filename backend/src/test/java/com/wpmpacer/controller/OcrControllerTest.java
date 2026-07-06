package com.wpmpacer.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.multipart.MultipartFile;

import com.wpmpacer.service.OcrService;

@WebMvcTest(OcrController.class)
class OcrControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OcrService ocrService;

    @Test
    void extractReturnsRecognisedText() throws Exception {
        given(ocrService.extractText(any(MultipartFile.class)))
                .willReturn("The quick brown fox");

        MockMultipartFile image = new MockMultipartFile(
                "image", "photo.png", "image/png", new byte[] {1, 2, 3});

        mockMvc.perform(multipart("/api/ocr").file(image))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.text").value("The quick brown fox"))
                .andExpect(jsonPath("$.characterCount").value(19));
    }
}
