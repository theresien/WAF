package com.wafap.dto;

import com.wafap.model.Event;
import com.wafap.model.EventType;
import java.time.LocalDateTime;

public record EventDTO(
    Long id,
    Long deviceId,
    String deviceMac,
    String deviceIp,
    LocalDateTime timestamp,
    EventType eventType,
    String messageJson,
    String ruleId,
    Integer severity,
    String sourceIp,
    String requestUri,
    String userAgent
) {
    public static EventDTO fromEntity(Event event) {
        return new EventDTO(
            event.getId(),
            event.getDevice() != null ? event.getDevice().getId() : null,
            event.getDevice() != null ? event.getDevice().getMacAddress() : null,
            event.getDevice() != null ? event.getDevice().getIpAddress() : null,
            event.getTimestamp(),
            event.getEventType(),
            event.getMessageJson(),
            event.getRuleId(),
            event.getSeverity(),
            event.getSourceIp(),
            event.getRequestUri(),
            event.getUserAgent()
        );
    }
}
