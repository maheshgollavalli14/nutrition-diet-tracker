package com.nutrition.tracker.config;

import com.nutrition.tracker.entity.FoodCatalog;
import com.nutrition.tracker.entity.NutritionBasis;
import com.nutrition.tracker.repository.FoodCatalogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final FoodCatalogRepository foodCatalogRepository;

    public DataInitializer(FoodCatalogRepository foodCatalogRepository) {
        this.foodCatalogRepository = foodCatalogRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initialize() {
        // Ensure default catalog foods exist if empty (e.g., initial DB setup)
        if (foodCatalogRepository.count() == 0) {
            log.info("Food catalog is empty. Seeding initial catalog foods...");
            seedFoodCatalog();
            log.info("Initial food catalog seeded.");
        }
    }

    private void seedFoodCatalog() {
        List<FoodCatalog> items = List.of(
                new FoodCatalog("Chicken Breast (Raw)", null, "g", NutritionBasis.PER_100G, new BigDecimal("100.00"),
                        new BigDecimal("165.00"), new BigDecimal("0.00"), new BigDecimal("31.00"), new BigDecimal("3.60"),
                        new BigDecimal("0.00"), new BigDecimal("0.00"), false, null),
                new FoodCatalog("Brown Rice (Cooked)", null, "g", NutritionBasis.PER_100G, new BigDecimal("100.00"),
                        new BigDecimal("112.00"), new BigDecimal("24.00"), new BigDecimal("2.60"), new BigDecimal("0.90"),
                        new BigDecimal("1.80"), new BigDecimal("0.40"), false, null),
                new FoodCatalog("Rolled Oats", null, "g", NutritionBasis.PER_100G, new BigDecimal("100.00"),
                        new BigDecimal("389.00"), new BigDecimal("66.00"), new BigDecimal("17.00"), new BigDecimal("7.00"),
                        new BigDecimal("10.60"), new BigDecimal("1.00"), false, null),
                new FoodCatalog("Greek Yogurt (Plain Non-fat)", null, "g", NutritionBasis.PER_100G, new BigDecimal("100.00"),
                        new BigDecimal("59.00"), new BigDecimal("3.60"), new BigDecimal("10.00"), new BigDecimal("0.40"),
                        new BigDecimal("0.00"), new BigDecimal("3.20"), false, null),
                new FoodCatalog("Whole Egg (Large)", null, "egg", NutritionBasis.PER_SERVING, new BigDecimal("1.00"),
                        new BigDecimal("72.00"), new BigDecimal("0.40"), new BigDecimal("6.30"), new BigDecimal("4.80"),
                        new BigDecimal("0.00"), new BigDecimal("0.20"), false, null),
                new FoodCatalog("Banana (Fresh)", null, "g", NutritionBasis.PER_100G, new BigDecimal("100.00"),
                        new BigDecimal("89.00"), new BigDecimal("23.00"), new BigDecimal("1.10"), new BigDecimal("0.30"),
                        new BigDecimal("2.60"), new BigDecimal("12.20"), false, null),
                new FoodCatalog("Atlantic Salmon Fillet", null, "g", NutritionBasis.PER_100G, new BigDecimal("100.00"),
                        new BigDecimal("208.00"), new BigDecimal("0.00"), new BigDecimal("20.00"), new BigDecimal("13.00"),
                        new BigDecimal("0.00"), new BigDecimal("0.00"), false, null),
                new FoodCatalog("Nutella Hazelnut Spread", "3017620422003", "g", NutritionBasis.PER_100G, new BigDecimal("100.00"),
                        new BigDecimal("539.00"), new BigDecimal("57.50"), new BigDecimal("6.30"), new BigDecimal("30.90"),
                        new BigDecimal("3.00"), new BigDecimal("56.30"), false, null)
        );
        foodCatalogRepository.saveAll(items);
    }
}
