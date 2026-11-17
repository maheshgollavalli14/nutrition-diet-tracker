package com.nutrition.tracker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutrition.tracker.dto.BarcodeLookupResponse;
import com.nutrition.tracker.entity.FoodCatalog;
import com.nutrition.tracker.entity.NutritionBasis;
import com.nutrition.tracker.repository.FoodCatalogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

@Service
public class BarcodeService {

    private static final Logger log = LoggerFactory.getLogger(BarcodeService.class);

    private final FoodCatalogRepository foodCatalogRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${openfoodfacts.api.url:https://world.openfoodfacts.org/api/v2/product/}")
    private String openFoodFactsUrl;

    @Value("${openfoodfacts.user-agent:NutritionDietTracker - SpringBoot - Version 1.0}")
    private String userAgent;

    public BarcodeService(FoodCatalogRepository foodCatalogRepository) {
        this.foodCatalogRepository = foodCatalogRepository;
        org.springframework.http.client.SimpleClientHttpRequestFactory factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(2500);
        factory.setReadTimeout(3500);
        this.restTemplate = new RestTemplate(factory);
        this.objectMapper = new ObjectMapper();
    }

    public BarcodeLookupResponse lookupBarcode(String rawBarcode) {
        if (rawBarcode == null || rawBarcode.trim().isEmpty()) {
            return BarcodeLookupResponse.notFound("", "Barcode cannot be blank.");
        }

        String barcode = rawBarcode.trim();

        // 1. Check local food catalog first
        Optional<FoodCatalog> localFoodOpt = foodCatalogRepository.findByBarcode(barcode);
        if (localFoodOpt.isPresent()) {
            FoodCatalog food = localFoodOpt.get();
            BarcodeLookupResponse response = new BarcodeLookupResponse();
            response.setFound(true);
            response.setBarcode(barcode);
            response.setProductName(food.getName());
            response.setServingSize(food.getServingSize());
            response.setServingUnit(food.getServingUnit());
            response.setCalories(food.getCalories());
            response.setCarbohydrates(food.getCarbohydrates());
            response.setProtein(food.getProtein());
            response.setFat(food.getFat());
            response.setFiber(food.getFiber());
            response.setSugar(food.getSugar());
            response.setMessage("Found in local food catalog.");
            return response;
        }

        // 2. Query Open Food Facts API
        try {
            String url = openFoodFactsUrl + barcode + ".json";
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", userAgent);
            headers.setAccept(MediaType.parseMediaTypes("application/json"));
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> responseEntity = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            if (responseEntity.getStatusCode() == HttpStatus.OK && responseEntity.getBody() != null) {
                JsonNode root = objectMapper.readTree(responseEntity.getBody());
                int status = root.path("status").asInt(0);

                if (status == 1 && root.has("product")) {
                    JsonNode product = root.path("product");
                    return parseOpenFoodFactsProduct(barcode, product);
                } else {
                    return BarcodeLookupResponse.notFound(barcode, "Product not found in Open Food Facts database for barcode: " + barcode);
                }
            } else {
                return BarcodeLookupResponse.notFound(barcode, "No product details returned for barcode: " + barcode);
            }
        } catch (org.springframework.web.client.HttpClientErrorException.NotFound ex) {
            log.info("Product not found on Open Food Facts for barcode {}: {}", barcode, ex.getMessage());
            return BarcodeLookupResponse.notFound(barcode, "Product not found in Open Food Facts database for barcode: " + barcode);
        } catch (RestClientException ex) {
            log.warn("External Open Food Facts API lookup failed for barcode {}: {}", barcode, ex.getMessage());
            return BarcodeLookupResponse.notFound(barcode, "External food database is currently unreachable. You can enter this food item manually.");
        } catch (Exception ex) {
            log.error("Error processing barcode lookup for {}: {}", barcode, ex.getMessage());
            return BarcodeLookupResponse.notFound(barcode, "Unable to parse product details. Please use manual entry.");
        }
    }

    private BarcodeLookupResponse parseOpenFoodFactsProduct(String barcode, JsonNode product) {
        BarcodeLookupResponse resp = new BarcodeLookupResponse();
        resp.setFound(true);
        resp.setBarcode(barcode);

        String name = product.path("product_name").asText();
        if (name == null || name.isBlank()) {
            name = product.path("product_name_en").asText();
        }
        if (name == null || name.isBlank()) {
            name = "Packaged Product (" + barcode + ")";
        }
        resp.setProductName(name);
        resp.setBrands(product.path("brands").asText(""));
        resp.setImageUrl(product.path("image_front_url").asText(null));
        resp.setQuantityDescription(product.path("quantity").asText(""));

        // Nutriments node
        JsonNode nutriments = product.path("nutriments");
        BigDecimal calories = parseNutrient(nutriments, "energy-kcal_100g", "energy-kcal");
        if (calories == null) {
            // Some entries use energy_100g in kJ, convert to kcal: kJ / 4.184
            BigDecimal energyKj = parseNutrient(nutriments, "energy_100g", "energy");
            if (energyKj != null) {
                calories = energyKj.divide(new BigDecimal("4.184"), 2, RoundingMode.HALF_UP);
            }
        }

        BigDecimal carbs = parseNutrient(nutriments, "carbohydrates_100g", "carbohydrates");
        BigDecimal protein = parseNutrient(nutriments, "proteins_100g", "proteins");
        BigDecimal fat = parseNutrient(nutriments, "fat_100g", "fat");
        BigDecimal fiber = parseNutrient(nutriments, "fiber_100g", "fiber");
        BigDecimal sugar = parseNutrient(nutriments, "sugars_100g", "sugars");

        resp.setServingSize(new BigDecimal("100.00"));
        resp.setServingUnit("g");
        resp.setCalories(calories != null ? calories : BigDecimal.ZERO);
        resp.setCarbohydrates(carbs != null ? carbs : BigDecimal.ZERO);
        resp.setProtein(protein != null ? protein : BigDecimal.ZERO);
        resp.setFat(fat != null ? fat : BigDecimal.ZERO);
        resp.setFiber(fiber != null ? fiber : BigDecimal.ZERO);
        resp.setSugar(sugar != null ? sugar : BigDecimal.ZERO);

        if (calories == null && carbs == null && protein == null && fat == null) {
            resp.setMessage("Product identified, but nutrition facts were not provided by the manufacturer. Please verify and edit values before logging.");
        } else {
            resp.setMessage("Product retrieved from Open Food Facts per 100g serving.");
        }

        return resp;
    }

    private BigDecimal parseNutrient(JsonNode nutriments, String primaryKey, String secondaryKey) {
        if (nutriments.has(primaryKey) && !nutriments.path(primaryKey).isNull()) {
            double val = nutriments.path(primaryKey).asDouble(-1.0);
            if (val >= 0) {
                return BigDecimal.valueOf(val).setScale(2, RoundingMode.HALF_UP);
            }
        }
        if (nutriments.has(secondaryKey) && !nutriments.path(secondaryKey).isNull()) {
            double val = nutriments.path(secondaryKey).asDouble(-1.0);
            if (val >= 0) {
                return BigDecimal.valueOf(val).setScale(2, RoundingMode.HALF_UP);
            }
        }
        return null;
    }
}
