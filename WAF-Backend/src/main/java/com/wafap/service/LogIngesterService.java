package com.wafap.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wafap.dto.ModSecurityLogDTO;
import com.wafap.model.Device;
import com.wafap.model.Event;
import com.wafap.model.EventType;
import com.wafap.repository.DeviceRepository;
import com.wafap.repository.EventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class LogIngesterService {

    private static final Logger logger = LoggerFactory.getLogger(LogIngesterService.class);

    private final DeviceRepository deviceRepository;
    private final EventRepository eventRepository;
    private final PolicyService policyService;
    private final ObjectMapper objectMapper;

    @Value("${wafap.modsecurity.severity-threshold:3}")
    private int severityThreshold;

    public LogIngesterService(
            DeviceRepository deviceRepository,
            EventRepository eventRepository,
            PolicyService policyService,
            ObjectMapper objectMapper) {
        this.deviceRepository = deviceRepository;
        this.eventRepository = eventRepository;
        this.policyService = policyService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void ingestModSecurityLog(String jsonLog) {
        try {
            ModSecurityLogDTO logDto = objectMapper.readValue(jsonLog, ModSecurityLogDTO.class);
            processModSecurityLog(logDto, jsonLog);
        } catch (Exception e) {
            logger.error("Failed to parse ModSecurity log: {}", e.getMessage(), e);
            throw new RuntimeException("Invalid ModSecurity log format", e);
        }
    }

    private void processModSecurityLog(ModSecurityLogDTO logDto, String originalJson) {
        var transaction = logDto.transaction();
        if (transaction == null || transaction.clientIp() == null) {
            logger.warn("ModSecurity log missing transaction or client IP");
            return;
        }

        String clientIp = transaction.clientIp();
        Optional<Device> deviceOpt = deviceRepository.findByIpAddress(clientIp);

        if (deviceOpt.isEmpty()) {
            logger.info("Unknown device with IP {} attempted HTTP attack", clientIp);
            // Create a temporary device entry for unknown devices
            Device unknownDevice = new Device();
            unknownDevice.setIpAddress(clientIp);
            unknownDevice.setMacAddress("unknown");
            unknownDevice.setHostname("Unknown Host");
            deviceOpt = Optional.of(deviceRepository.save(unknownDevice));
        }

        Device device = deviceOpt.get();

        // Extract attack details
        Integer highestSeverity = extractHighestSeverity(transaction);
        String ruleId = extractRuleId(transaction);
        String requestUri = transaction.request() != null ? transaction.request().uri() : null;
        String userAgent = extractUserAgent(transaction);

        // Create event
        Event event = new Event(device, EventType.HTTP_ATTACK, originalJson);
        event.setSourceIp(clientIp);
        event.setSeverity(highestSeverity);
        event.setRuleId(ruleId);
        event.setRequestUri(requestUri);
        event.setUserAgent(userAgent);
        eventRepository.save(event);

        logger.info("HTTP attack detected from {} (MAC: {}) - Severity: {}, Rule: {}",
                clientIp, device.getMacAddress(), highestSeverity, ruleId);

        // Check if ban is needed based on severity
        if (highestSeverity != null && highestSeverity >= severityThreshold) {
            String banReason = String.format("ModSecurity rule %s triggered (severity %d)", ruleId, highestSeverity);
            policyService.banDevice(device, banReason, null);
        }
    }

    private Integer extractHighestSeverity(ModSecurityLogDTO.Transaction transaction) {
        if (transaction.messages() == null || transaction.messages().isEmpty()) {
            return 0;
        }

        return transaction.messages().stream()
                .map(ModSecurityLogDTO.Message::details)
                .filter(details -> details != null && details.severity() != null)
                .map(ModSecurityLogDTO.Details::severity)
                .max(Integer::compareTo)
                .orElse(0);
    }

    private String extractRuleId(ModSecurityLogDTO.Transaction transaction) {
        if (transaction.messages() == null || transaction.messages().isEmpty()) {
            return "unknown";
        }

        return transaction.messages().stream()
                .map(ModSecurityLogDTO.Message::details)
                .filter(details -> details != null && details.ruleId() != null)
                .map(ModSecurityLogDTO.Details::ruleId)
                .findFirst()
                .orElse("unknown");
    }

    private String extractUserAgent(ModSecurityLogDTO.Transaction transaction) {
        if (transaction.request() == null || transaction.request().headers() == null) {
            return null;
        }

        return transaction.request().headers().getOrDefault("User-Agent", null);
    }
}
