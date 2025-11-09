package com.wafap.dto;

import com.wafap.model.Device;
import com.wafap.model.DeviceStatus;
import java.time.LocalDateTime;

public record DeviceDTO(
    Long id,
    String macAddress,
    String ipAddress,
    String hostname,
    String vendor,
    DeviceStatus status,
    LocalDateTime firstSeen,
    LocalDateTime lastSeen,
    Integer failedAttempts,
    String banReason,
    LocalDateTime bannedAt,
    LocalDateTime bannedUntil,
    Boolean isConnected
) {
    public static DeviceDTO fromEntity(Device device) {
        return new DeviceDTO(
            device.getId(),
            device.getMacAddress(),
            device.getIpAddress(),
            device.getHostname(),
            device.getVendor(),
            device.getStatus(),
            device.getFirstSeen(),
            device.getLastSeen(),
            device.getFailedAttempts(),
            device.getBanReason(),
            device.getBannedAt(),
            device.getBannedUntil(),
            device.getIsConnected()
        );
    }
}
