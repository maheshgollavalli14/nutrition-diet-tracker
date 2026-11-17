package com.nutrition.tracker;

import com.nutrition.tracker.dto.BarcodeLookupResponse;
import com.nutrition.tracker.entity.FoodCatalog;
import com.nutrition.tracker.entity.NutritionBasis;
import com.nutrition.tracker.repository.FoodCatalogRepository;
import com.nutrition.tracker.service.BarcodeService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(locations = "classpath:application-test.properties")
class BarcodeServiceTest {

    @Autowired
    private BarcodeService barcodeService;

    @Autowired
    private FoodCatalogRepository foodCatalogRepository;

    @Test
    @DisplayName("Should gracefully handle unknown barcode and return notFound response")
    void testUnknownBarcodeGracefulFailure() {
        BarcodeLookupResponse response = barcodeService.lookupBarcode("999999999999999999");
        assertNotNull(response);
        assertFalse(response.isFound());
        assertNotNull(response.getMessage());
    }

    @Test
    @DisplayName("Should handle empty or blank barcode gracefully")
    void testBlankBarcode() {
        BarcodeLookupResponse response = barcodeService.lookupBarcode("   ");
        assertNotNull(response);
        assertFalse(response.isFound());
    }

    @Test
    @DisplayName("Should return matching local catalog item if barcode exists locally")
    void testLocalCatalogBarcodeMatch() {
        String testBarcode = "9988776655443";
        foodCatalogRepository.findByBarcode(testBarcode).ifPresent(foodCatalogRepository::delete);

        FoodCatalog catalogFood = new FoodCatalog("Test Barcode Juice", testBarcode, "ml", NutritionBasis.PER_100G,
                new BigDecimal("100.00"), new BigDecimal("45.00"), new BigDecimal("11.00"),
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("10.00"), false, null);
        foodCatalogRepository.save(catalogFood);

        BarcodeLookupResponse response = barcodeService.lookupBarcode(testBarcode);
        assertNotNull(response);
        assertTrue(response.isFound());
        assertEquals("Test Barcode Juice", response.getProductName());
        assertEquals(new BigDecimal("45.00"), response.getCalories());
    }
}
