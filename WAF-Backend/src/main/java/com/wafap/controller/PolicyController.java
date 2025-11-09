package com.wafap.controller;

import com.wafap.dto.DeviceDTO;
import com.wafap.dto.PolicyActionRequest;
import com.wafap.model.Device;
import com.wafap.repository.DeviceRepository;
import com.wafap.service.PolicyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/policy")
@Tag(name = "Policy", description = "Device access policy management (Ban/Allow)")
public class PolicyController {

    private final DeviceRepository deviceRepository;
    private final PolicyService policyService;

    public PolicyController(DeviceRepository deviceRepository, PolicyService policyService) {
        this.deviceRepository = deviceRepository;
        this.policyService = policyService;
    }

    @PostMapping("/devices/{macAddress}/ban")
    @Operation(
        summary = "Ban a device",
        description = "Block network access for a device by MAC address"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Device banned successfully"),
        @ApiResponse(responseCode = "404", description = "Device not found"),
        @ApiResponse(responseCode = "500", description = "Failed to apply ban")
    })
    public ResponseEntity<?> banDevice(
            @PathVariable
            @Parameter(description = "MAC address of the device to ban")
            String macAddress,
            @Valid @RequestBody PolicyActionRequest request) {

        var deviceOpt = deviceRepository.findByMacAddress(macAddress.toLowerCase());
        if (deviceOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of(
                "status", "error",
                "message", "Device not found: " + macAddress
            ));
        }

        Device device = deviceOpt.get();
        boolean success = policyService.banDevice(
                device,
                request.reason(),
                request.durationSeconds()
        );

        if (success) {
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Device banned successfully",
                "device", DeviceDTO.fromEntity(device)
            ));
        } else {
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "error",
                "message", "Failed to apply ban"
            ));
        }
    }

    @PostMapping("/devices/{macAddress}/allow")
    @Operation(
        summary = "Allow (unban) a device",
        description = "Restore network access for a previously banned device"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Device allowed successfully"),
        @ApiResponse(responseCode = "404", description = "Device not found"),
        @ApiResponse(responseCode = "500", description = "Failed to remove ban")
    })
    public ResponseEntity<?> allowDevice(
            @PathVariable
            @Parameter(description = "MAC address of the device to allow")
            String macAddress,
            @Valid @RequestBody PolicyActionRequest request) {

        var deviceOpt = deviceRepository.findByMacAddress(macAddress.toLowerCase());
        if (deviceOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of(
                "status", "error",
                "message", "Device not found: " + macAddress
            ));
        }

        Device device = deviceOpt.get();
        boolean success = policyService.allowDevice(device, request.reason());

        if (success) {
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Device allowed successfully",
                "device", DeviceDTO.fromEntity(device)
            ));
        } else {
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "error",
                "message", "Failed to remove ban"
            ));
        }
    }

    @GetMapping("/stats")
    @Operation(
        summary = "Get ban statistics",
        description = "Retrieve statistics about device bans and policies"
    )
    public ResponseEntity<PolicyService.BanStats> getBanStats() {
        return ResponseEntity.ok(policyService.getBanStats());
    }
}
