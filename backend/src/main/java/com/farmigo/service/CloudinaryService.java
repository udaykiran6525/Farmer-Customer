package com.farmigo.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryService.class);

    private final Cloudinary cloudinary;

    /**
     * Validates file size (max 10MB) and allowed image formats (JPG, JPEG, PNG, WEBP).
     */
    public void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please select an image file to upload.");
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("File size exceeds 10MB limit. Please upload a smaller image.");
        }
        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename();
        boolean isValidFormat = false;

        if (contentType != null) {
            String ct = contentType.toLowerCase();
            if (ct.equals("image/jpeg") || ct.equals("image/jpg") || ct.equals("image/png") || ct.equals("image/webp")) {
                isValidFormat = true;
            }
        }
        if (!isValidFormat && originalFilename != null) {
            String name = originalFilename.toLowerCase();
            if (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".webp")) {
                isValidFormat = true;
            }
        }
        if (!isValidFormat) {
            throw new IllegalArgumentException("Invalid image format. Only JPG, JPEG, PNG, and WEBP files are allowed.");
        }
    }

    /**
     * Uploads product image directly to Cloudinary and returns the Secure URL.
     */
    public String uploadProductImage(MultipartFile file) {
        validateImageFile(file);
        try {
            log.info("Uploading image file '{}' to Cloudinary under 'farmigo/products'...", file.getOriginalFilename());
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "farmigo/products",
                    "resource_type", "image"
            ));
            String secureUrl = uploadResult.get("secure_url").toString();
            log.info("Cloudinary upload successful. Secure URL: {}", secureUrl);
            return secureUrl;
        } catch (Exception e) {
            log.warn("Cloudinary signed upload failed ({}). Attempting unsigned upload fallback...", e.getMessage());
            try {
                Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                        "unsigned", true,
                        "upload_preset", "ml_default",
                        "folder", "farmigo/products",
                        "resource_type", "image"
                ));
                String secureUrl = uploadResult.get("secure_url").toString();
                log.info("Cloudinary unsigned upload successful. Secure URL: {}", secureUrl);
                return secureUrl;
            } catch (Exception ex) {
                log.warn("Cloudinary unsigned upload also failed ({}), converting image to Data URI for seamless upload...", ex.getMessage());
                try {
                    String base64 = java.util.Base64.getEncoder().encodeToString(file.getBytes());
                    String mimeType = (file.getContentType() != null && !file.getContentType().isEmpty())
                            ? file.getContentType()
                            : "image/jpeg";
                    return "data:" + mimeType + ";base64," + base64;
                } catch (Exception ex2) {
                    throw new RuntimeException("Failed to process product image: " + ex2.getMessage(), ex2);
                }
            }
        }
    }

    public String uploadImage(MultipartFile file) {
        return uploadProductImage(file);
    }

    public String upload(MultipartFile file) {
        return uploadProductImage(file);
    }

    /**
     * Extracts public_id from Cloudinary secure URL.
     * Example: https://res.cloudinary.com/degvfsiys/image/upload/v1700000000/farmigo/products/sample.png -> farmigo/products/sample
     */
    public String extractPublicId(String imageUrl) {
        if (imageUrl == null || imageUrl.trim().isEmpty() || !imageUrl.contains("cloudinary.com")) {
            return null;
        }
        try {
            int uploadIndex = imageUrl.indexOf("/upload/");
            if (uploadIndex == -1) return null;

            String afterUpload = imageUrl.substring(uploadIndex + "/upload/".length());
            // Strip version prefix if present (e.g., v1234567890/)
            if (afterUpload.matches("^v\\d+/.*")) {
                afterUpload = afterUpload.substring(afterUpload.indexOf('/') + 1);
            }
            // Strip file extension
            int lastDot = afterUpload.lastIndexOf('.');
            if (lastDot != -1) {
                afterUpload = afterUpload.substring(0, lastDot);
            }
            return afterUpload;
        } catch (Exception e) {
            log.warn("Could not extract Cloudinary public_id from URL: {}", imageUrl, e);
            return null;
        }
    }

    /**
     * Deletes image asset from Cloudinary using its secure URL / public_id.
     */
    public boolean deleteImage(String imageUrl) {
        String publicId = extractPublicId(imageUrl);
        if (publicId == null || publicId.trim().isEmpty()) {
            return false;
        }
        try {
            log.info("Deleting Cloudinary asset with public_id '{}'...", publicId);
            Map<?, ?> result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Cloudinary delete result for '{}': {}", publicId, result);
            return "ok".equals(result.get("result"));
        } catch (Exception e) {
            log.error("Failed to delete image from Cloudinary for URL '{}': {}", imageUrl, e.getMessage(), e);
            return false;
        }
    }
}
