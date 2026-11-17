package com.nutrition.tracker.dto;

import java.time.Instant;

public class UserResponse {

    private Long id;
    private String email;
    private String fullName;
    private String timezone;
    private Instant createdAt;

    public UserResponse() {
    }

    public UserResponse(Long id, String email, String fullName, String timezone, Instant createdAt) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.timezone = timezone;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
