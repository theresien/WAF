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

import java.io.IOException;
import java.net.InetAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

/**
 * Service that reads DHCP leases from dnsmasq and updates device inventory
 * Format: <expiry-time> <mac-address> <ip-address> <hostname> <client-id>
 * Example: 1234567890 aa:bb:cc:dd:ee:ff 192.168.1.100 laptop-001 *
 */
@Service
public class DhcpLeaseReader {

    private static final Logger logger = LoggerFactory.getLogger(DhcpLeaseReader.class);

    private final DeviceRepository deviceRepository;
    private final EventRepository eventRepository;
    private final MacVendorService macVendorService;

    @Value("${wafap.dhcp.leases-file:/var/lib/dnsmasq/dhcp.leases}")
    private String leasesFilePath;

    public DhcpLeaseReader(DeviceRepository deviceRepository, EventRepository eventRepository, MacVendorService macVendorService) {
        this.deviceRepository = deviceRepository;
        this.eventRepository = eventRepository;
        this.macVendorService = macVendorService;
    }

    @Scheduled(fixedDelayString = "${wafap.dhcp.scan-interval:60000}")
    @Transactional
    public void scanDhcpLeases() {
        try {
            Path leasesFile = Path.of(leasesFilePath);

            if (!Files.exists(leasesFile)) {
                logger.warn("DHCP leases file not found: {}", leasesFilePath);
                return;
            }

            Set<String> activeMacs = new HashSet<>();
            var lines = Files.readAllLines(leasesFile);

            for (String line : lines) {
                if (line.isBlank()) {
                    continue;
                }

                parseLeaseLine(line, activeMacs);
            }

            logger.debug("Scanned {} active DHCP leases", activeMacs.size());

        } catch (IOException e) {
            logger.error("Error reading DHCP leases file: {}", e.getMessage(), e);
        }
    }

    private void parseLeaseLine(String line, Set<String> activeMacs) {
        try {
            String[] parts = line.trim().split("\\s+");

            if (parts.length < 3) {
                logger.debug("Invalid lease line format: {}", line);
                return;
            }

            // Parse lease components
            // long expiryTime = Long.parseLong(parts[0]); // Unix timestamp
            String macAddress = parts[1].toLowerCase();
            String ipAddress = parts[2];
            String hostname = parts.length > 3 && !parts[3].equals("*") ? parts[3] : null;
            
            // Try DNS reverse lookup if hostname not provided
            if (hostname == null || hostname.isBlank()) {
                hostname = resolveHostname(ipAddress);
            }

            activeMacs.add(macAddress);

            // Find or create device
            Optional<Device> deviceOpt = deviceRepository.findByMacAddress(macAddress);

            if (deviceOpt.isPresent()) {
                Device device = deviceOpt.get();

                // Update device info
                if (!ipAddress.equals(device.getIpAddress())) {
                    logger.info("Device {} IP changed: {} -> {}", macAddress, device.getIpAddress(), ipAddress);
                    device.setIpAddress(ipAddress);
                }

                if (hostname != null && !hostname.equals(device.getHostname())) {
                    device.setHostname(hostname);
                }

                // Update vendor if not set
                if (device.getVendor() == null) {
                    String vendor = macVendorService.getVendor(macAddress);
                    if (vendor != null) {
                        device.setVendor(vendor);
                    }
                }

                device.setLastSeen(LocalDateTime.now());
                deviceRepository.save(device);

            } else {
                // New device detected
                Device newDevice = new Device(macAddress, ipAddress);
                newDevice.setHostname(hostname);
                newDevice.setVendor(macVendorService.getVendor(macAddress));
                newDevice.setStatus(DeviceStatus.MONITORED);
                deviceRepository.save(newDevice);

                // Log connection event
                Event event = new Event(newDevice, EventType.DEVICE_CONNECTED);
                event.setSourceIp(ipAddress);
                eventRepository.save(event);

                logger.info("New device connected: MAC={}, IP={}, Hostname={}, Vendor={}",
                        macAddress, ipAddress, hostname, newDevice.getVendor());
            }

        } catch (Exception e) {
            logger.error("Error parsing lease line '{}': {}", line, e.getMessage());
        }
    }

    private String resolveHostname(String ipAddress) {
        try {
            InetAddress addr = InetAddress.getByName(ipAddress);
            String hostname = addr.getCanonicalHostName();
            // Only return if it's not just the IP address
            return !hostname.equals(ipAddress) ? hostname : null;
        } catch (Exception e) {
            logger.debug("Could not resolve hostname for IP {}: {}", ipAddress, e.getMessage());
            return null;
        }
    }
}
