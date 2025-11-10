package com.wafap.exception;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handle validation errors from @Valid annotations
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        logger.warn("Validation failed: {}", errors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
            "status", "error",
            "type", "validation_error",
            "errors", errors
        ));
    }

    /**
     * Handle constraint violations from JPA
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<?> handleConstraintViolation(ConstraintViolationException ex) {
        logger.warn("Constraint violation: {}", ex.getMessage());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
            "status", "error",
            "type", "constraint_violation",
            "message", "Data validation failed"
        ));
    }

    /**
     * Handle malformed JSON
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> handleMessageNotReadable(HttpMessageNotReadableException ex) {
        logger.warn("Malformed request: {}", ex.getMessage());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
            "status", "error",
            "type", "malformed_request",
            "message", "Invalid request format"
        ));
    }

    /**
     * Handle type mismatches in request parameters
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<?> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        logger.warn("Type mismatch: {} expected {}", ex.getName(), ex.getRequiredType());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
            "status", "error",
            "type", "invalid_parameter",
            "message", "Invalid parameter type: " + ex.getName()
        ));
    }

    /**
     * Handle entity not found
     */
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<?> handleEntityNotFound(EntityNotFoundException ex) {
        logger.warn("Entity not found: {}", ex.getMessage());

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
            "status", "error",
            "type", "not_found",
            "message", "Resource not found"
        ));
    }

    /**
     * Handle authentication failures
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<?> handleAuthenticationException(AuthenticationException ex) {
        logger.warn("Authentication failed: {}", ex.getMessage());

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
            "status", "error",
            "type", "authentication_failed",
            "message", "Authentication failed"
        ));
    }

    /**
     * Handle bad credentials specifically
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<?> handleBadCredentials(BadCredentialsException ex) {
        logger.warn("Bad credentials attempt");

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
            "status", "error",
            "type", "invalid_credentials",
            "message", "Invalid username or password"
        ));
    }

    /**
     * Handle access denied
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDenied(AccessDeniedException ex) {
        logger.warn("Access denied: {}", ex.getMessage());

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
            "status", "error",
            "type", "access_denied",
            "message", "Access denied"
        ));
    }

    /**
     * Handle illegal arguments (e.g., from input validation)
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgument(IllegalArgumentException ex) {
        logger.warn("Illegal argument: {}", ex.getMessage());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
            "status", "error",
            "type", "invalid_input",
            "message", ex.getMessage() != null ? ex.getMessage() : "Invalid input"
        ));
    }

    /**
     * Handle security exceptions
     */
    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<?> handleSecurityException(SecurityException ex) {
        logger.error("Security violation: {}", ex.getMessage());

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
            "status", "error",
            "type", "security_violation",
            "message", "Security violation detected"
        ));
    }

    /**
     * Handle all other runtime exceptions
     * DO NOT expose internal error messages
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntimeException(RuntimeException ex) {
        // Log full stack trace for debugging
        logger.error("Unexpected runtime error", ex);

        // Return generic error to client (no details)
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "status", "error",
            "type", "internal_error",
            "message", "An internal error occurred"
        ));
    }

    /**
     * Handle all other exceptions
     * DO NOT expose internal error messages
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneralException(Exception ex) {
        // Log full stack trace for debugging
        logger.error("Unexpected error", ex);

        // Return error details for debugging
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "status", "error",
            "type", "server_error",
            "message", ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred",
            "error", ex.getClass().getSimpleName()
        ));
    }
}
