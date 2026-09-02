package com.capstone.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * Default dev implementation: writes files to the local {@code file.upload-dir}
 * directory, served statically under {@code /uploads/**} by {@code WebConfig}.
 */
@Service
@ConditionalOnProperty(name = "storage.s3.enabled", havingValue = "false", matchIfMissing = true)
public class LocalFileStorageService implements StorageService {

    @Value("${file.upload-dir:uploads/}")
    private String uploadDir;

    @Override
    public String store(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("No file provided");
        }
        try {
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = UUID.randomUUID() + extension;

            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            Path filePath = uploadPath.resolve(filename);
            file.transferTo(filePath.toFile());

            return "/uploads/" + filename;
        } catch (IOException e) {
            throw new IllegalStateException("Upload failed: " + e.getMessage(), e);
        }
    }
}