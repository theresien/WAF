package com.wafap.service;

import com.wafap.model.Device;
import com.wafap.repository.DeviceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.HashSet;
import java.util.Set;

@Service
public class ConnectionMonitor {

    private static final Logger logger = LoggerFactory.getLogger(ConnectionMonitor.class);
    private final DeviceRepository deviceRepository;

    public ConnectionMonitor(DeviceRepository deviceRepository) {
        this.deviceRepository = deviceRepository;
    }

    @Scheduled(fixedRate = 15000)
    @Transactional
    public void updateConnectedDevices() {
        Set<String> connectedMacs = getConnectedMacAddresses();
        
        deviceRepository.findAll().forEach(device -> {
            boolean isConnected = connectedMacs.contains(device.getMacAddress().toLowerCase());
            
            // Only update if status changed
            if (device.getIsConnected() == null || device.getIsConnected() != isConnected) {
                device.setIsConnected(isConnected);
                deviceRepository.save(device);
                logger.info("Device {} ({}) connection status: {}", 
                    device.getMacAddress(), device.getIpAddress(), isConnected ? "ONLINE" : "OFFLINE");
            }
        });
    }

    private Set<String> getConnectedMacAddresses() {
        Set<String> macs = new HashSet<>();
        try {
            // Use ip neigh show on the WiFi interface only
            Process process = Runtime.getRuntime().exec(new String[]{"ip", "neigh", "show", "dev", "wlp3s0"});
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            
            String line;
            while ((line = reader.readLine()) != null) {
                // Only accept REACHABLE for truly connected devices
                if (line.contains("REACHABLE")) {
                    String[] parts = line.split("\\s+");
                    for (int i = 0; i < parts.length - 1; i++) {
                        if (parts[i].equals("lladdr")) {
                            String mac = parts[i + 1].toLowerCase();
                            macs.add(mac);
                            logger.debug("Connected device: {}", mac);
                            break;
                        }
                    }
                }
            }
            reader.close();
            logger.info("Total connected devices: {}", macs.size());
        } catch (Exception e) {
            logger.error("Error reading connected devices: {}", e.getMessage());
        }
        return macs;
    }
}
