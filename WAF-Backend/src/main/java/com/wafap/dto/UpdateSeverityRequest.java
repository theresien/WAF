package com.wafap.dto;

import jakarta.validation.constraints.*;

public record UpdateSeverityRequest(
    @NotNull(message = "Severity is required")
    @Min(value = 1, message = "Severity must be between 1 and 5")
    @Max(value = 5, message = "Severity must be between 1 and 5")
    Integer severity
) {}
