package com.wpmpacer.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.wpmpacer.dto.OcrResponse;
import com.wpmpacer.service.OcrService;

/**
 * {@code POST /api/ocr} — accepts a multipart image and returns the text
 * extracted by Tesseract. The frontend shows the result in an editable
 * textarea so the user can correct recognition errors.
 */
@RestController
@RequestMapping("/api/ocr")
public class OcrController {

    private final OcrService ocrService;

    public OcrController(OcrService ocrService) {
        this.ocrService = ocrService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public OcrResponse extract(@RequestParam("image") MultipartFile image) {
        String text = ocrService.extractText(image);
        return OcrResponse.of(text);
    }
}
