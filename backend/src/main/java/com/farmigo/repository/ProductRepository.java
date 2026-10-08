package com.farmigo.repository;

import com.farmigo.entity.Product;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByFarmerId(Long farmerId);
    List<Product> findByCategoryIgnoreCaseAndStatusIgnoreCase(String category, String status);
    List<Product> findByIsAvailableTrueAndStatusIgnoreCase(String status);
    List<Product> findByStatusIgnoreCase(String status);

    @Query("SELECT p FROM Product p WHERE p.isAvailable = true AND LOWER(p.status) = 'approved' AND LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY p.name ASC")
    List<Product> findSuggestions(@Param("query") String query, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.isAvailable = true AND LOWER(p.status) = 'approved' AND " +
           "(:category IS NULL OR :category = 'all' OR LOWER(p.category) = LOWER(:category)) AND " +
           "(:search IS NULL OR :search = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
           "(:farmerId IS NULL OR p.farmer.id = :farmerId)")
    List<Product> searchProducts(@Param("search") String search,
                                 @Param("category") String category,
                                 @Param("minPrice") Double minPrice,
                                 @Param("maxPrice") Double maxPrice,
                                 @Param("farmerId") Long farmerId);
}
