package com.farmigo.service;

import com.farmigo.dto.ProductRequest;
import com.farmigo.entity.Product;
import com.farmigo.entity.User;
import com.farmigo.exception.ResourceNotFoundException;
import com.farmigo.repository.ProductRepository;
import com.farmigo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.PageRequest;

import java.io.File;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;

    public Map<String, Object> getProducts(String search, String category, Double minPrice, Double maxPrice, Long farmerId, String sort) {
        String filterCategory = category;
        if (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("all")) {
            String norm = normalizeCategory(category);
            filterCategory = (norm != null) ? norm : category.trim();
        }
        List<Product> products = productRepository.searchProducts(search, filterCategory, minPrice, maxPrice, farmerId);
        if (sort != null) {
            switch (sort) {
                case "price_asc":
                    products.sort((a, b) -> Double.compare(a.getPrice(), b.getPrice()));
                    break;
                case "price_desc":
                    products.sort((a, b) -> Double.compare(b.getPrice(), a.getPrice()));
                    break;
                case "name":
                    products.sort((a, b) -> a.getName().compareToIgnoreCase(b.getName()));
                    break;
                case "rating":
                    products.sort((a, b) -> Double.compare(b.getRatings(), a.getRatings()));
                    break;
                default:
                    products.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
                    break;
            }
        } else {
            products.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        }

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("count", products.size());
        res.put("products", products);
        return res;
    }

    public Map<String, Object> searchSuggestions(String query) {
        List<Product> suggestions;
        if (query == null || query.trim().isEmpty()) {
            suggestions = Collections.emptyList();
        } else {
            suggestions = productRepository.findSuggestions(query.trim(), PageRequest.of(0, 8));
        }
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("suggestions", suggestions);
        res.put("products", suggestions);
        return res;
    }

    public Map<String, Object> getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("product", product);
        return res;
    }

    public Map<String, Object> getMyProducts(Long farmerId) {
        List<Product> products = productRepository.findByFarmerId(farmerId);
        products.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("count", products.size());
        res.put("products", products);
        return res;
    }

    @Transactional
    public Map<String, Object> createProduct(Long farmerId, ProductRequest req, MultipartFile imageFile) {
        User farmer = userRepository.findById(farmerId)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found"));

        if (!"farmer".equalsIgnoreCase(farmer.getRole())) {
            throw new IllegalArgumentException("Only farmers can add products");
        }

        MultipartFile fileToUpload = (imageFile != null && !imageFile.isEmpty()) ? imageFile :
                                     ((req.getImage() != null && !req.getImage().isEmpty()) ? req.getImage() :
                                     ((req.getImageFile() != null && !req.getImageFile().isEmpty()) ? req.getImageFile() : null));

        if (fileToUpload != null && !fileToUpload.isEmpty()) {
            if (fileToUpload.getSize() > 10 * 1024 * 1024) {
                throw new IllegalArgumentException("Image size exceeds 10MB limit.");
            }
            String contentType = fileToUpload.getContentType();
            if (contentType != null && !contentType.equalsIgnoreCase("image/jpeg") && !contentType.equalsIgnoreCase("image/jpg") && !contentType.equalsIgnoreCase("image/png") && !contentType.equalsIgnoreCase("image/webp")) {
                throw new IllegalArgumentException("Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed.");
            }
        }

        String imageUrl = "";
        if (fileToUpload != null && !fileToUpload.isEmpty()) {
            imageUrl = cloudinaryService.upload(fileToUpload);
            if (imageUrl == null || imageUrl.trim().isEmpty()) {
                throw new IllegalArgumentException("Image upload failed. Please try again.");
            }
        } else if (req.getImageUrl() != null && !req.getImageUrl().isEmpty()) {
            imageUrl = req.getImageUrl();
        }

        if (req.getCategory() == null || req.getCategory().trim().isEmpty()) {
            throw new IllegalArgumentException("Product category is required. Please select a category.");
        }
        String category = normalizeCategory(req.getCategory());
        if (category == null) {
            throw new IllegalArgumentException("Invalid product category: " + req.getCategory());
        }

        Product product = Product.builder()
                .farmer(farmer)
                .name(req.getName())
                .category(category)
                .price(req.getPrice() != null ? req.getPrice() : 0.0)
                .unit(req.getUnit() != null ? req.getUnit() : "kg")
                .quantity(req.getQuantity() != null ? req.getQuantity() : 0)
                .description(req.getDescription() != null ? req.getDescription() : "")
                .weight(req.getWeight() != null ? req.getWeight() : "")
                .shelfLife(req.getShelfLife() != null ? req.getShelfLife() : "")
                .harvestDate(req.getHarvestDate() != null ? req.getHarvestDate() : "")
                .imageUrl(imageUrl)
                .isOrganic(req.getIsOrganic() != null ? req.getIsOrganic() : false)
                .isAvailable(true)
                .status("PENDING")
                .ratings(4.0)
                .reviewCount(0)
                .build();

        productRepository.save(product);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Product uploaded successfully. Pending Admin Approval.");
        res.put("product", product);
        return res;
    }

    public Map<String, Object> getPendingProducts() {
        List<Product> pendingProducts = productRepository.findByStatusIgnoreCase("PENDING");
        pendingProducts.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("count", pendingProducts.size());
        res.put("products", pendingProducts);
        return res;
    }

    @Transactional
    public Map<String, Object> approveProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        product.setStatus("APPROVED");
        product.setIsAvailable(true);
        productRepository.save(product);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Product approved successfully and is now live on marketplace.");
        res.put("product", product);
        return res;
    }

    @Transactional
    public Map<String, Object> rejectProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        product.setStatus("REJECTED");
        productRepository.save(product);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Product has been rejected.");
        res.put("product", product);
        return res;
    }

    @Transactional
    public Map<String, Object> updateProduct(Long farmerId, Long productId, ProductRequest req, MultipartFile imageFile) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (!product.getFarmer().getId().equals(farmerId)) {
            throw new IllegalArgumentException("Not authorized to update this product");
        }

        if (req.getName() != null) product.setName(req.getName());
        if (req.getCategory() != null && !req.getCategory().trim().isEmpty()) {
            String category = normalizeCategory(req.getCategory());
            if (category == null) {
                throw new IllegalArgumentException("Invalid product category: " + req.getCategory());
            }
            product.setCategory(category);
        }
        if (req.getPrice() != null) product.setPrice(req.getPrice());
        if (req.getUnit() != null) product.setUnit(req.getUnit());
        if (req.getQuantity() != null) product.setQuantity(req.getQuantity());
        if (req.getDescription() != null) product.setDescription(req.getDescription());
        if (req.getWeight() != null) product.setWeight(req.getWeight());
        if (req.getShelfLife() != null) product.setShelfLife(req.getShelfLife());
        if (req.getHarvestDate() != null) product.setHarvestDate(req.getHarvestDate());
        if (req.getIsOrganic() != null) product.setIsOrganic(req.getIsOrganic());
        if (req.getIsAvailable() != null) product.setIsAvailable(req.getIsAvailable());

        MultipartFile fileToUpload = (imageFile != null && !imageFile.isEmpty()) ? imageFile :
                                     ((req.getImage() != null && !req.getImage().isEmpty()) ? req.getImage() :
                                     ((req.getImageFile() != null && !req.getImageFile().isEmpty()) ? req.getImageFile() : null));

        if (fileToUpload != null && !fileToUpload.isEmpty()) {
            // Validate file size and type using CloudinaryService
            cloudinaryService.validateImageFile(fileToUpload);
            // Delete old Cloudinary image if it exists
            if (product.getImageUrl() != null && !product.getImageUrl().trim().isEmpty()) {
                try {
                    cloudinaryService.deleteImage(product.getImageUrl());
                } catch (Exception e) {
                    // Log and continue upload
                }
            }
            String newImageUrl = cloudinaryService.uploadProductImage(fileToUpload);
            if (newImageUrl == null || newImageUrl.trim().isEmpty()) {
                throw new IllegalArgumentException("Image upload failed. Please try again.");
            }
            product.setImageUrl(newImageUrl);

        } else if (req.getImageUrl() != null && !req.getImageUrl().trim().isEmpty()) {
            boolean hasExistingImage = product.getImageUrl() != null && !product.getImageUrl().trim().isEmpty();
            if (!hasExistingImage) {
                product.setImageUrl(req.getImageUrl().trim());
            }
        }

        productRepository.save(product);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Product updated successfully.");
        res.put("product", product);
        return res;
    }

    @Transactional
    public Map<String, Object> deleteProduct(Long farmerId, Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (!product.getFarmer().getId().equals(farmerId)) {
            throw new IllegalArgumentException("Not authorized to delete this product");
        }

        // Delete associated Cloudinary image asset
        if (product.getImageUrl() != null && !product.getImageUrl().trim().isEmpty()) {
            try {
                cloudinaryService.deleteImage(product.getImageUrl());
            } catch (Exception e) {
                // Log and proceed with product record deletion
            }
        }

        productRepository.delete(product);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Product deleted successfully.");
        return res;
    }

    public static final List<String> OFFICIAL_CATEGORIES = List.of(
            "Vegetables",
            "Fruits",
            "Grains & Rice",
            "Pulses & Dals",
            "Dry Fruits",
            "Spices"
    );

    public static String normalizeCategory(String rawCategory) {
        if (rawCategory == null || rawCategory.trim().isEmpty()) {
            return null;
        }
        String c = rawCategory.trim().toLowerCase();

        // 1. Dry Fruits (Must be checked before fruits to avoid prefix collision)
        if (c.equals("dry fruits") || c.equals("dry fruit") || c.equals("dryfruits") || c.equals("dry-fruits") || c.equals("nuts")) {
            return "Dry Fruits";
        }
        // 2. Fruits
        if (c.equals("fruits") || c.equals("fruit")) {
            return "Fruits";
        }
        // 3. Vegetables
        if (c.equals("vegetables") || c.equals("vegetable")) {
            return "Vegetables";
        }
        // 4. Grains & Rice
        if (c.equals("grains & rice") || c.equals("grains and rice") || c.equals("grains") || c.equals("grain") || c.equals("rice") || c.equals("millets") || c.equals("millet")) {
            return "Grains & Rice";
        }
        // 5. Pulses & Dals
        if (c.equals("pulses & dals") || c.equals("pulses and dals") || c.equals("pulses") || c.equals("pulse") || c.equals("dals") || c.equals("dal") || c.equals("legumes")) {
            return "Pulses & Dals";
        }
        // 6. Spices
        if (c.equals("spices") || c.equals("spice")) {
            return "Spices";
        }

        for (String cat : OFFICIAL_CATEGORIES) {
            if (cat.equalsIgnoreCase(rawCategory.trim())) {
                return cat;
            }
        }

        return null;
    }
}
