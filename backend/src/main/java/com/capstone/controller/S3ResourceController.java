package com.capstone.controller;

import com.capstone.service.S3FileStorageService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

import java.io.IOException;
import java.time.Duration;

/**
 * Serves stored photos back to the browser under /uploads/** when S3 storage is
 * enabled (storage.s3.enabled=true). S3-compatible buckets are usually private,
 * so we stream objects from the bucket through the API instead of exposing them
 * directly. In local mode (storage.s3.enabled=false) this bean does not exist
 * and WebConfig serves /uploads/** straight from disk.
 */
@RestController
@ConditionalOnProperty(name = "storage.s3.enabled", havingValue = "true")
public class S3ResourceController {

    private final S3FileStorageService s3FileStorageService;

    public S3ResourceController(S3FileStorageService s3FileStorageService) {
        this.s3FileStorageService = s3FileStorageService;
    }

    @GetMapping("/uploads/**")
    public ResponseEntity<byte[]> getUpload(HttpServletRequest request) throws IOException {
        String uri = request.getRequestURI();
        String prefix = "/uploads/";
        String key = uri.contains(prefix) ? uri.substring(uri.indexOf(prefix) + prefix.length()) : uri.substring(1);
        if (key.isBlank()) {
            return ResponseEntity.notFound().build();
        }

        ResponseInputStream<GetObjectResponse> s3Object;
        try {
            s3Object = s3FileStorageService.getObject(key);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }

        try (s3Object) {
            byte[] content = s3Object.readAllBytes();
            return ResponseEntity.ok()
                    .contentType(resolveMediaType(key))
                    .contentLength(content.length)
                    .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic())
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                    .body(content);
        }
    }

    private MediaType resolveMediaType(String key) {
        String lower = key.toLowerCase();
        if (lower.endsWith(".png")) return MediaType.IMAGE_PNG;
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return MediaType.IMAGE_JPEG;
        if (lower.endsWith(".gif")) return MediaType.IMAGE_GIF;
        if (lower.endsWith(".webp")) return MediaType.parseMediaType("image/webp");
        if (lower.endsWith(".svg")) return MediaType.parseMediaType("image/svg+xml");
        return MediaType.APPLICATION_OCTET_STREAM;
    }
}