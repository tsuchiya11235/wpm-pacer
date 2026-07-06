package com.wpmpacer.service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import javax.imageio.ImageIO;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.wpmpacer.config.OcrProperties;
import com.wpmpacer.exception.BadRequestException;
import com.wpmpacer.exception.OcrProcessingException;

import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;

/**
 * Extracts text from an uploaded image using Tesseract via Tess4J.
 *
 * <p>This is real server-side processing (not a stub): the uploaded bytes are
 * decoded into a {@link BufferedImage} and handed to the native Tesseract
 * engine. Language data ({@code eng.traineddata}) must be present in the
 * configured {@code wpm-pacer.ocr.datapath}; see the project README.
 *
 * <p>A fresh {@link Tesseract} instance is created per request because the
 * engine is not thread-safe.
 */
@Service
public class OcrService {

    private static final Logger log = LoggerFactory.getLogger(OcrService.class);

    private final OcrProperties properties;

    public OcrService(OcrProperties properties) {
        this.properties = properties;
    }

    public String extractText(MultipartFile file) {
        validateUpload(file);
        BufferedImage image = decodeImage(file);
        return runTesseract(image);
    }

    private void validateUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("No image file was uploaded.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
            throw new BadRequestException(
                    "Unsupported file type: " + contentType
                            + ". Please upload an image (PNG, JPEG, etc.).");
        }
    }

    private BufferedImage decodeImage(MultipartFile file) {
        try (ByteArrayInputStream in = new ByteArrayInputStream(file.getBytes())) {
            BufferedImage image = ImageIO.read(in);
            if (image == null) {
                throw new BadRequestException(
                        "The uploaded file could not be read as an image.");
            }
            return image;
        } catch (IOException e) {
            throw new BadRequestException("Failed to read the uploaded image: " + e.getMessage());
        }
    }

    private String runTesseract(BufferedImage image) {
        ensureLanguageDataPresent();
        Tesseract tesseract = new Tesseract();
        tesseract.setDatapath(properties.datapath());
        tesseract.setLanguage(properties.language());
        try {
            String text = tesseract.doOCR(image);
            return text == null ? "" : text.strip();
        } catch (TesseractException e) {
            log.warn("Tesseract failed to process image", e);
            throw new OcrProcessingException(
                    "OCR failed to process the image. Please try a clearer photo "
                            + "or enter the text manually.", e);
        } catch (UnsatisfiedLinkError | NoClassDefFoundError e) {
            log.error("Native Tesseract library is unavailable", e);
            throw new OcrProcessingException(
                    "The OCR engine is not available on this server. "
                            + "See README for Tesseract setup.", e);
        }
    }

    /**
     * Fails fast with an actionable message when the language data is missing,
     * rather than surfacing an opaque native error.
     */
    private void ensureLanguageDataPresent() {
        Path dataDir = Paths.get(properties.datapath());
        Path trainedData = dataDir.resolve(properties.language() + ".traineddata");
        if (!Files.isDirectory(dataDir) || !Files.isRegularFile(trainedData)) {
            throw new OcrProcessingException(
                    "OCR language data not found at '" + trainedData.toAbsolutePath()
                            + "'. Download " + properties.language()
                            + ".traineddata into the configured tessdata directory "
                            + "(see README), or enter the text manually.");
        }
    }
}
