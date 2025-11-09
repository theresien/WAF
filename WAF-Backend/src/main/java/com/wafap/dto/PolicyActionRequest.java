package com.wafap.dto;

import jakarta.validation.constraints.NotBlank;

public record PolicyActionRequest(
    @NotBlank(message = "Reason is required")
    String reason,

    Long durationSeconds  // null = permanent, otherwise temporary ban
) {
    public PolicyActionRequest(String reason) {
        this(reason, null);
    }
}
