package com.wpmpacer.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import com.wpmpacer.config.OcrProperties;
import com.wpmpacer.exception.BadRequestException;
import com.wpmpacer.exception.OcrProcessingException;

/**
 * Unit tests for {@link OcrService} input validation and pre-flight checks.
 * These exercise everything up to (but not requiring) the native engine, so
 * they run without a Tesseract install.
 */
class OcrServiceTest {

    private final OcrService ocrService =
            new OcrService(new OcrProperties("./tessdata-nonexistent", "eng"));

    @Test
    void rejectsEmptyUpload() {
        MockMultipartFile empty = new MockMultipartFile(
                "image", "empty.png", "image/png", new byte[0]);

        assertThatThrownBy(() -> ocrService.extractText(empty))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void rejectsNonImageContentType() {
        MockMultipartFile textFile = new MockMultipartFile(
                "image", "notes.txt", "text/plain", "hello".getBytes());

        assertThatThrownBy(() -> ocrService.extractText(textFile))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void rejectsUndecodableImage() {
        MockMultipartFile broken = new MockMultipartFile(
                "image", "broken.png", "image/png", "not really a png".getBytes());

        assertThatThrownBy(() -> ocrService.extractText(broken))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void failsClearlyWhenLanguageDataMissing() throws IOException {
        MockMultipartFile validImage = new MockMultipartFile(
                "image", "blank.png", "image/png", tinyPng());

        assertThatThrownBy(() -> ocrService.extractText(validImage))
                .isInstanceOf(OcrProcessingException.class)
                .hasMessageContaining("language data");
    }

    private static byte[] tinyPng() throws IOException {
        BufferedImage image = new BufferedImage(4, 4, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return out.toByteArray();
    }
}
