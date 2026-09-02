package com.capstone.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * Abstraction over file (photo) storage.
 * Implementations:
 *  - {@link LocalFileStorageService}: stores files on local disk (default, dev).
 *  - {@link S3FileStorageService}: stores files in an S3-compatible bucket
 *    (Neon Storage, AWS S3, Cloudflare R2, MinIO, ...). Enabled with
 *    {@code storage.s3.enabled=true}.
 */
public interface StorageService {

    /**
     * Stores the given file and returns its publicly reachable URL.
     * The URL is persisted by callers (e.g. product imageUrls, profile image).
     */
    String store(MultipartFile file);
}