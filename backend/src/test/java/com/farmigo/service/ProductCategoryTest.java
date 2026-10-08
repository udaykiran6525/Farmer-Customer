package com.farmigo.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

public class ProductCategoryTest {

    @Test
    @DisplayName("Farmer selects Dry Fruits -> Normalized category must be exactly 'Dry Fruits' and NEVER 'Fruits'")
    void testDryFruitsNeverBecomesFruits() {
        String result = ProductService.normalizeCategory("Dry Fruits");
        assertEquals("Dry Fruits", result);
        assertNotEquals("Fruits", result);

        String lowercaseResult = ProductService.normalizeCategory("dry fruits");
        assertEquals("Dry Fruits", lowercaseResult);
        assertNotEquals("Fruits", lowercaseResult);
    }

    @Test
    @DisplayName("Farmer selects Fruits -> Normalized category must be 'Fruits'")
    void testFruitsCategory() {
        assertEquals("Fruits", ProductService.normalizeCategory("Fruits"));
        assertEquals("Fruits", ProductService.normalizeCategory("fruits"));
        assertEquals("Fruits", ProductService.normalizeCategory("fruit"));
    }

    @Test
    @DisplayName("Official categories are preserved exactly")
    void testOfficialCategories() {
        assertEquals("Vegetables", ProductService.normalizeCategory("Vegetables"));
        assertEquals("Fruits", ProductService.normalizeCategory("Fruits"));
        assertEquals("Grains & Rice", ProductService.normalizeCategory("Grains & Rice"));
        assertEquals("Pulses & Dals", ProductService.normalizeCategory("Pulses & Dals"));
        assertEquals("Dry Fruits", ProductService.normalizeCategory("Dry Fruits"));
        assertEquals("Spices", ProductService.normalizeCategory("Spices"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   ", "Meat", "Organic", "UnknownCategory", "Dairy", "FastFood"})
    @DisplayName("Invalid or blank categories return null and NEVER fallback to Fruits or Vegetables")
    void testInvalidCategoriesReturnNull(String invalidCategory) {
        String result = ProductService.normalizeCategory(invalidCategory);
        assertNull(result, "Expected null for invalid category: " + invalidCategory);
        assertNotEquals("Fruits", result);
        assertNotEquals("Vegetables", result);
    }

    @Test
    @DisplayName("Null category returns null without falling back")
    void testNullCategoryReturnsNull() {
        String result = ProductService.normalizeCategory(null);
        assertNull(result);
        assertNotEquals("Fruits", result);
        assertNotEquals("Vegetables", result);
    }

    @Test
    @DisplayName("Verify strict test cases from specification")
    void testSpecificationScenarios() {
        // Test 1: Farmer selects Dry Fruits, Product: Pistachios
        assertEquals("Dry Fruits", ProductService.normalizeCategory("Dry Fruits"));

        // Test 2: Farmer selects Dry Fruits, Product: Kismis / Raisins
        assertEquals("Dry Fruits", ProductService.normalizeCategory("Dry Fruits"));

        // Test 3: Farmer selects Fruits, Product: Apple
        assertEquals("Fruits", ProductService.normalizeCategory("Fruits"));

        // Test 4: Farmer selects Vegetables, Product: Potato
        assertEquals("Vegetables", ProductService.normalizeCategory("Vegetables"));

        // Test 5: Farmer selects Grains & Rice, Product: Basmati Rice
        assertEquals("Grains & Rice", ProductService.normalizeCategory("Grains & Rice"));

        // Test 6: Farmer selects Pulses & Dals, Product: Toor Dal
        assertEquals("Pulses & Dals", ProductService.normalizeCategory("Pulses & Dals"));

        // Test 7: Farmer selects Spices, Product: Turmeric
        assertEquals("Spices", ProductService.normalizeCategory("Spices"));
    }
}
