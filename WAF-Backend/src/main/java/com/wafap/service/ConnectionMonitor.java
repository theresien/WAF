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

    @Scheduled(fixedRate = 5000)
    @Transactional
    public void updateConnectedDevices() {
        Set<String> connectedMacs = getConnectedMacAddresses();
        
        deviceRepository.findAll().forEach(device -> {
            boolean isConnected = connectedMacs.contains(device.getMacAddress().toLowerCase());
            if (device.getIsConnected() != isConnected) {
                device.setIsConnected(isConnected);
                deviceRepository.save(device);
            }
        });
    }

    private Set<String> getConnectedMacAddresses() {
        Set<String> macs = new HashSet<>();
        try {
            Process process = Runtime.getRuntime().exec(new String[]{"ip", "neigh", "show"});
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.contains("REACHABLE") || line.contains("STALE") || line.contains("DELAY")) {
                    String[] parts = line.split("\\s+");
                    for (int i = 0; i < parts.length - 1; i++) {
                        if (parts[i].equals("lladdr")) {
                            macs.add(parts[i + 1].toLowerCase());
                            break;
                        }
                    }
                }
            }
            reader.close();
        } catch (Exception e) {
            logger.error("Error reading connected devices: {}", e.getMessage());
        }
        return macs;
    }
}
