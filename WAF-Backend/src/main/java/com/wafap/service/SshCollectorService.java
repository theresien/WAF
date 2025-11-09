package com.wafap.service;

import com.wafap.model.Device;
import com.wafap.model.Event;
import com.wafap.model.EventType;
import com.wafap.repository.DeviceRepository;
import com.wafap.repository.EventRepository;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Optional;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service that monitors SSH authentication failures via journalctl
 * Uses Java 21 Virtual Threads for efficient I/O operations
 */
@Service
public class SshCollectorService {

    private static final Logger logger = LoggerFactory.getLogger(SshCollectorService.class);

    // Pattern to extract IP from SSH failed auth: "Failed password for user from 192.168.1.100 port 12345"
    private static final Pattern SSH_FAILED_PATTERN = Pattern.compile(
            "Failed (?:password|publickey) for .+ from (\\d+\\.\\d+\\.\\d+\\.\\d+)"
    );

    private final DeviceRepository deviceRepository;
    private final EventRepository eventRepository;
    private final PolicyService policyService;
    private final ExecutorService virtualThreadExecutor;

    @Value("${wafap.ssh.max-failed-attempts:5}")
    private int maxFailedAttempts;

    private Process journalProcess;
    private volatile boolean running = false;

    public SshCollectorService(
            DeviceRepository deviceRepository,
            EventRepository eventRepository,
            PolicyService policyService) {
        this.deviceRepository = deviceRepository;
        this.eventRepository = eventRepository;
        this.policyService = policyService;
        // Use Java 21 Virtual Threads
        this.virtualThreadExecutor = Executors.newVirtualThreadPerTaskExecutor();
    }

    @PostConstruct
    public void start() {
        running = true;
        virtualThreadExecutor.submit(this::monitorSshLogs);
        logger.info("SSH Collector Service started with Virtual Threads");
    }

    @PreDestroy
    public void stop() {
        running = false;
        if (journalProcess != null && journalProcess.isAlive()) {
            journalProcess.destroy();
        }
        virtualThreadExecutor.shutdown();
        logger.info("SSH Collector Service stopped");
    }

    private void monitorSshLogs() {
        while (running) {
            try {
                // Follow SSH logs in real-time
                ProcessBuilder pb = new ProcessBuilder("journalctl", "-u", "ssh", "-u", "sshd", "-f", "-o", "cat");
                journalProcess = pb.start();

                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(journalProcess.getInputStream()))) {

                    String line;
                    while (running && (line = reader.readLine()) != null) {
                        processSshLogLine(line);
                    }
                }

            } catch (IOException e) {
                if (running) {
                    logger.error("Error reading SSH logs: {}", e.getMessage());
                    // Wait before retrying
                    try {
                        Thread.sleep(5000);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }
    }

    private void processSshLogLine(String line) {
        Matcher matcher = SSH_FAILED_PATTERN.matcher(line);
        if (!matcher.find()) {
            return;
        }

        String sourceIp = matcher.group(1);
        logger.debug("SSH failed authentication from IP: {}", sourceIp);

        // Find device by IP
        Optional<Device> deviceOpt = deviceRepository.findByIpAddress(sourceIp);

        if (deviceOpt.isEmpty()) {
            logger.info("SSH failed auth from unknown IP: {}", sourceIp);
            return;
        }

        Device device = deviceOpt.get();

        // Create event
        Event event = new Event(device, EventType.SSH_FAILED_AUTH);
        event.setSourceIp(sourceIp);
        event.setMessageJson(line);
        eventRepository.save(event);

        // Increment failed attempts
        device.incrementFailedAttempts();
        deviceRepository.save(device);

        logger.info("SSH failed auth from {} (MAC: {}) - Total failures: {}",
                sourceIp, device.getMacAddress(), device.getFailedAttempts());

        // Check if ban is needed
        if (device.getFailedAttempts() >= maxFailedAttempts) {
            String banReason = String.format("Exceeded maximum SSH failed attempts (%d)", maxFailedAttempts);
            policyService.banDevice(device, banReason, null);
        }
    }
}
