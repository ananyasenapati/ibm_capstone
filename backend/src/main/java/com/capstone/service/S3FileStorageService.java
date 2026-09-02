package com.capstone.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.Bucket;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.ListBucketsResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Production-oriented implementation backed by any S3-compatible object store
 * (Neon Storage, AWS S3, Cloudflare R2, MinIO, ...).
 *
 * Activate with storage.s3.enabled=true plus the storage.s3.* properties
 * (endpoint, region, bucket, access-key, secret-key). Values are kept out of
 * git - put them in the gitignored application-local.properties or pass them
 * as environment variables (AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID,
 * AWS_SECRET_ACCESS_KEY, AWS_REGION).
 */
@Service
@ConditionalOnProperty(name = "storage.s3.enabled", havingValue = "true")
public class S3FileStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(S3FileStorageService.class);

    @Value("${storage.s3.endpoint:}")
    private String endpoint;

    @Value("${storage.s3.region:us-east-2}")
    private String region;

    @Value("${storage.s3.bucket:}")
    private String configuredBucket;

    @Value("${storage.s3.access-key:}")
    private String accessKey;

    @Value("${storage.s3.secret-key:}")
    private String secretKey;

    private S3Client s3;
    private String bucket;
    private String publicBaseUrl;

    @PostConstruct
    void init() {
        if (endpoint == null || endpoint.isBlank()) {
            throw new IllegalStateException(
                    "storage.s3.enabled=true but storage.s3.endpoint is empty. "
                            + "Set AWS_ENDPOINT_URL_S3 / storage.s3.endpoint.");
        }
        if (accessKey == null || accessKey.isBlank() || secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException(
                    "storage.s3.enabled=true but S3 credentials are missing. "
                            + "Set AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY.");
        }

        this.s3 = S3Client.builder()
                .region(Region.of(region))
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .forcePathStyle(true)
                .build();

        this.bucket = resolveBucket();

        String base = endpoint.endsWith("/") ? endpoint.substring(0, endpoint.length() - 1) : endpoint;
        this.publicBaseUrl = base + "/" + bucket;

        log.info("S3 photo storage active - endpoint={}, bucket={}", endpoint, bucket);
    }

    /**
     * Resolves the target bucket: uses the explicitly configured one when present,
     * otherwise falls back to the first bucket the credentials can list on the
     * endpoint (typical single-bucket setups), and finally to the endpoint's
     * first host label.
     */
    private String resolveBucket() {
        try {
            ListBucketsResponse response = s3.listBuckets();
            List<String> names = response.buckets().stream().map(Bucket::name).collect(Collectors.toList());
            if (configuredBucket != null && !configuredBucket.isBlank()) {
                if (!names.isEmpty() && !names.contains(configuredBucket)) {
                    log.warn("Configured bucket '{}' not found on endpoint. Buckets visible: {}",
                            configuredBucket, names);
                }
                return configuredBucket;
            }
            if (!names.isEmpty()) {
                return names.get(0);
            }
            log.warn("No buckets visible on the S3 endpoint - create one and set storage.s3.bucket.");
        } catch (Exception e) {
            log.warn("Could not list buckets on S3 endpoint ({}); using endpoint-derived bucket name",
                    e.getMessage());
        }
        String host = URI.create(endpoint).getHost();
        return host != null ? host.split("\\.")[0] : "uploads";
    }

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
            String key = UUID.randomUUID() + extension;

            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                    .build();

            s3.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            // Return a server-relative URL; S3ResourceController streams the
            // object through /uploads/** (buckets are typically private).
            return "/uploads/" + key;
        } catch (IOException e) {
            throw new IllegalStateException("Upload failed: " + e.getMessage(), e);
        }
    }

    /**
     * Fetches a stored object so it can be streamed to the client
     * (used by the /uploads/** resource controller).
     */
    public ResponseInputStream<GetObjectResponse> getObject(String key) {
        return s3.getObject(GetObjectRequest.builder().bucket(bucket).key(key).build());
    }
}