package com.nutrition.tracker.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

public class FoodLogUpdateRequest {

    @NotNull(message = "Consumed quantity is required")
    @DecimalMin(value = "0.01", message = "Consumed quantity must be greater than zero")
    private BigDecimal consumedQuantity;

    @NotBlank(message = "Serving unit is required")
    private String servingUnit;

    private Instant loggedAt;

    public FoodLogUpdateRequest() {
    }

    public FoodLogUpdateRequest(BigDecimal consumedQuantity, String servingUnit, Instant loggedAt) {
        this.consumedQuantity = consumedQuantity;
        this.servingUnit = servingUnit;
        this.loggedAt = loggedAt;
    }

    public BigDecimal getConsumedQuantity() {
        return consumedQuantity;
    }

    public void setConsumedQuantity(BigDecimal consumedQuantity) {
        this.consumedQuantity = consumedQuantity;
    }

    public String getServingUnit() {
        return servingUnit;
    }

    public void setServingUnit(String servingUnit) {
        this.servingUnit = servingUnit;
    }

    public Instant getLoggedAt() {
        return loggedAt;
    }

    public void setLoggedAt(Instant loggedAt) {
        this.loggedAt = loggedAt;
    }
}
