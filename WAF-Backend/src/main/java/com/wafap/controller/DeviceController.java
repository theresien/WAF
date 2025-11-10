package com.wafap.controller;

import com.wafap.dto.DeviceDTO;
import com.wafap.model.Device;
import com.wafap.model.DeviceStatus;
import com.wafap.repository.DeviceRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/devices")
@Tag(name = "Devices", description = "Device inventory management")
public class DeviceController {

    private final DeviceRepository deviceRepository;

    public DeviceController(DeviceRepository deviceRepository) {
        this.deviceRepository = deviceRepository;
    }

    @GetMapping
    @Operation(
        summary = "Get all devices",
        description = "Retrieve paginated list of all known devices"
    )
    public ResponseEntity<Page<DeviceDTO>> getAllDevices(
            @PageableDefault(size = 50, sort = "lastSeen", direction = Sort.Direction.DESC)
            Pageable pageable) {

        Page<DeviceDTO> devices = deviceRepository
                .findAll(pageable)
                .map(DeviceDTO::fromEntity);

        return ResponseEntity.ok(devices);
    }

    @GetMapping("/{id}")
    @Operation(
        summary = "Get device by ID",
        description = "Retrieve detailed information about a specific device"
    )
    public ResponseEntity<DeviceDTO> getDeviceById(@PathVariable Long id) {
        return deviceRepository.findById(id)
                .map(DeviceDTO::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/mac/{macAddress}")
    @Operation(
        summary = "Get device by MAC address",
        description = "Find device by its MAC address"
    )
    public ResponseEntity<DeviceDTO> getDeviceByMac(
            @PathVariable
            @Parameter(description = "MAC address (format: aa:bb:cc:dd:ee:ff)")
            String macAddress) {

        return deviceRepository.findByMacAddress(macAddress.toLowerCase())
                .map(DeviceDTO::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/ip/{ipAddress}")
    @Operation(
        summary = "Get device by IP address",
        description = "Find device by its current IP address"
    )
    public ResponseEntity<DeviceDTO> getDeviceByIp(@PathVariable String ipAddress) {
        return deviceRepository.findByIpAddress(ipAddress)
                .map(DeviceDTO::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    @Operation(
        summary = "Get devices by status",
        description = "Filter devices by their current status (ALLOWED, BANNED, MONITORED)"
    )
    public ResponseEntity<List<DeviceDTO>> getDevicesByStatus(
            @PathVariable
            @Parameter(description = "Device status")
            DeviceStatus status) {

        List<DeviceDTO> devices = deviceRepository.findByStatus(status)
                .stream()
                .map(DeviceDTO::fromEntity)
                .toList();

        return ResponseEntity.ok(devices);
    }

    @GetMapping("/active")
    @Operation(
        summary = "Get recently active devices",
        description = "Retrieve devices active within the last hour"
    )
    public ResponseEntity<List<DeviceDTO>> getRecentlyActiveDevices(
            @RequestParam(defaultValue = "1") int hours) {

        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        List<DeviceDTO> devices = deviceRepository.findRecentlyActive(since)
                .stream()
                .map(DeviceDTO::fromEntity)
                .toList();

        return ResponseEntity.ok(devices);
    }

    @GetMapping("/connected")
    @Operation(
        summary = "Get connected devices",
        description = "Retrieve devices currently connected to the hotspot"
    )
    public ResponseEntity<List<DeviceDTO>> getConnectedDevices() {
        List<DeviceDTO> devices = deviceRepository.findByIsConnected(true)
                .stream()
                .map(DeviceDTO::fromEntity)
                .toList();

        return ResponseEntity.ok(devices);
    }

    @PatchMapping("/{id}/hostname")
    @Operation(
        summary = "Update device hostname",
        description = "Update the hostname of a device"
    )
    public ResponseEntity<?> updateHostname(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {
        
        String hostname = body.get("hostname");
        if (hostname == null || hostname.isBlank()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Hostname is required"));
        }

        return deviceRepository.findById(id)
                .map(device -> {
                    device.setHostname(hostname);
                    deviceRepository.save(device);
                    return ResponseEntity.ok(DeviceDTO.fromEntity(device));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
