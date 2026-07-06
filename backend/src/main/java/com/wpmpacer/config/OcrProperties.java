package com.wpmpacer.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration for the Tess4J-based OCR service, bound from
 * {@code wpm-pacer.ocr.*} in application.yml.
 *
 * @param datapath directory containing Tesseract language data (eng.traineddata)
 * @param language Tesseract language code(s), e.g. "eng"
 */
@ConfigurationProperties(prefix = "wpm-pacer.ocr")
public record OcrProperties(String datapath, String language) {

    public OcrProperties {
        if (datapath == null || datapath.isBlank()) {
            datapath = "./tessdata";
        }
        if (language == null || language.isBlank()) {
            language = "eng";
        }
    }
}
