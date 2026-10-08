package com.farmigo.controller;

import com.farmigo.dto.ProductRequest;
import com.farmigo.security.UserPrincipal;
import com.farmigo.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getProducts(@RequestParam(required = false) String search,
                                                           @RequestParam(required = false) String category,
                                                           @RequestParam(required = false) Double minPrice,
                                                           @RequestParam(required = false) Double maxPrice,
                                                           @RequestParam(required = false) Long farmer,
                                                           @RequestParam(required = false) String sort) {
        return ResponseEntity.ok(productService.getProducts(search, category, minPrice, maxPrice, farmer, sort));
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchSuggestions(@RequestParam(required = false, defaultValue = "") String query) {
        return ResponseEntity.ok(productService.searchSuggestions(query));
    }

    @GetMapping("/my/products")
    public ResponseEntity<Map<String, Object>> getMyProducts(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(productService.getMyProducts(userPrincipal.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_FORM_URLENCODED_VALUE})
    public ResponseEntity<Map<String, Object>> createProduct(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                             @RequestParam(value = "image", required = false) MultipartFile image,
                                                             @RequestParam(value = "imageFile", required = false) MultipartFile imageFile,
                                                             @ModelAttribute ProductRequest req) {
        MultipartFile fileToUpload = (image != null && !image.isEmpty()) ? image :
                                     ((imageFile != null && !imageFile.isEmpty()) ? imageFile :
                                     ((req.getImage() != null && !req.getImage().isEmpty()) ? req.getImage() :
                                     ((req.getImageFile() != null && !req.getImageFile().isEmpty()) ? req.getImageFile() : null)));
        return ResponseEntity.ok(productService.createProduct(userPrincipal.getId(), req, fileToUpload));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> createProductJson(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                                 @RequestBody ProductRequest req) {
        return ResponseEntity.ok(productService.createProduct(userPrincipal.getId(), req, null));
    }

    @PutMapping(value = "/{id}", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_FORM_URLENCODED_VALUE})
    public ResponseEntity<Map<String, Object>> updateProduct(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                             @PathVariable Long id,
                                                             @RequestParam(value = "image", required = false) MultipartFile image,
                                                             @RequestParam(value = "imageFile", required = false) MultipartFile imageFile,
                                                             @ModelAttribute ProductRequest req) {
        MultipartFile fileToUpload = (image != null && !image.isEmpty()) ? image :
                                     ((imageFile != null && !imageFile.isEmpty()) ? imageFile :
                                     ((req.getImage() != null && !req.getImage().isEmpty()) ? req.getImage() :
                                     ((req.getImageFile() != null && !req.getImageFile().isEmpty()) ? req.getImageFile() : null)));
        return ResponseEntity.ok(productService.updateProduct(userPrincipal.getId(), id, req, fileToUpload));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> updateProductJson(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                                 @PathVariable Long id,
                                                                 @RequestBody ProductRequest req) {
        return ResponseEntity.ok(productService.updateProduct(userPrincipal.getId(), id, req, null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteProduct(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                             @PathVariable Long id) {
        return ResponseEntity.ok(productService.deleteProduct(userPrincipal.getId(), id));
    }
}
