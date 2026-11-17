package com.nutrition.tracker.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateProfileRequest {

    @NotBlank(message = "Full name cannot be blank")
    private String fullName;

    @NotBlank(message = "Timezone cannot be blank")
    private String timezone;

    public UpdateProfileRequest() {
    }

    public UpdateProfileRequest(String fullName, String timezone) {
        this.fullName = fullName;
        this.timezone = timezone;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }
}
