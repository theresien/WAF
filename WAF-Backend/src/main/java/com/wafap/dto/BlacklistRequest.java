package com.wafap.dto;

import jakarta.validation.constraints.*;

public record BlacklistRequest(
    @NotBlank(message = "Domain is required")
    @Pattern(regexp = "^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]$", message = "Invalid domain format")
    @Size(max = 255, message = "Domain too long")
    String domain,
    
    @Min(value = 1, message = "Severity must be between 1 and 5")
    @Max(value = 5, message = "Severity must be between 1 and 5")
    Integer severity
) {}
