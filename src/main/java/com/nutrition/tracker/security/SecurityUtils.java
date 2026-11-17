package com.nutrition.tracker.security;

import com.nutrition.tracker.entity.User;
import com.nutrition.tracker.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new UnauthorizedException("User is not authenticated");
        }
        return userDetails.getUser();
    }

    public static Long getCurrentUserId() {
        return getCurrentUser().getId();
    }
}
