package com.nutrition.tracker.exception;

public class DuplicateLogTimestampException extends RuntimeException {
    public DuplicateLogTimestampException(String message) {
        super(message);
    }
}
