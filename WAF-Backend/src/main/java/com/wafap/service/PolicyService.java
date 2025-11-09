package com.wafap.service;

import com.wafap.model.Device;
import com.wafap.model.DeviceStatus;
import com.wafap.model.Event;
import com.wafap.model.EventType;
import com.wafap.repository.DeviceRepository;
import com.wafap.repository.EventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PolicyService {

    private static final Logger logger = LoggerFactory.getLogger(PolicyService.class);

    private final DeviceRepository deviceRepository;
    private final EventRepository eventRepository;
    private final IptablesGateway iptablesGateway;

    @Value("${wafap.ssh.ban-duration:3600}")
    private long defaultBanDurationSeconds;

    public PolicyService(
            DeviceRepository deviceRepository,
            EventRepository eventRepository,
            IptablesGateway iptablesGateway) {
        this.deviceRepository = deviceRepository;
        this.eventRepository = eventRepository;
        this.iptablesGateway = iptablesGateway;
    }

    /**
     * Ban a device permanently or temporarily
     */
    @Transactional
    public boolean banDevice(Device device, String reason, Long durationSeconds) {
        if (device.isBanned()) {
            logger.info("Device {} is already banned", device.getMacAddress());
            return true;
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime bannedUntil = durationSeconds != null
                ? now.plusSeconds(durationSeconds)
                : null; // null = permanent

        device.setStatus(DeviceStatus.BANNED);
        device.setBanReason(reason);
        device.setBannedAt(now);
        device.setBannedUntil(bannedUntil);
        deviceRepository.save(device);

        // Apply firewall rules
        boolean success = iptablesGateway.banDevice(device.getMacAddress(), device.getIpAddress());

        if (success) {
            // Log ban event
            Event event = new Event(device, EventType.DEVICE_BANNED);
            event.setMessageJson(String.format("{\"reason\": \"%s\", \"duration\": %d}",
                    reason, durationSeconds != null ? durationSeconds : -1));
            eventRepository.save(event);

            logger.info("Device {} banned: {} (until: {})",
                    device.getMacAddress(), reason, bannedUntil != null ? bannedUntil : "permanent");
        }

        return success;
    }

    /**
     * Allow (unban) a device
     */
    @Transactional
    public boolean allowDevice(Device device, String reason) {
        if (!device.isBanned()) {
            logger.info("Device {} is not banned, setting to ALLOWED", device.getMacAddress());
        }

        device.setStatus(DeviceStatus.ALLOWED);
        device.setBanReason(null);
        device.setBannedAt(null);
        device.setBannedUntil(null);
        device.resetFailedAttempts();
        deviceRepository.save(device);

        // Remove firewall rules
        boolean success = iptablesGateway.unbanDevice(device.getMacAddress(), device.getIpAddress());

        if (success) {
            // Log unban event
            Event event = new Event(device, EventType.DEVICE_UNBANNED);
            event.setMessageJson(String.format("{\"reason\": \"%s\"}", reason));
            eventRepository.save(event);

            logger.info("Device {} allowed: {}", device.getMacAddress(), reason);
        }

        return success;
    }

    /**
     * Check and lift expired temporary bans
     * Runs every minute
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void checkExpiredBans() {
        LocalDateTime now = LocalDateTime.now();
        List<Device> expiredBans = deviceRepository.findExpiredBans(DeviceStatus.BANNED, now);

        if (expiredBans.isEmpty()) {
            return;
        }

        logger.info("Found {} expired bans to lift", expiredBans.size());

        for (Device device : expiredBans) {
            allowDevice(device, "Ban expired");
        }
    }

    /**
     * Get ban statistics
     */
    @Transactional(readOnly = true)
    public BanStats getBanStats() {
        long totalDevices = deviceRepository.count();
        long bannedCount = deviceRepository.countByStatus(DeviceStatus.BANNED);
        long allowedCount = deviceRepository.countByStatus(DeviceStatus.ALLOWED);
        long monitoredCount = deviceRepository.countByStatus(DeviceStatus.MONITORED);

        return new BanStats(totalDevices, bannedCount, allowedCount, monitoredCount);
    }

    public record BanStats(
            long totalDevices,
            long bannedDevices,
            long allowedDevices,
            long monitoredDevices
    ) {}
}
