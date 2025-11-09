package com.wafap.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/threat-intel")
@Tag(name = "Threat Intelligence", description = "Threat intelligence management (disabled)")
public class ThreatIntelController {

    @GetMapping("/stats")
    @Operation(summary = "Get threat intelligence statistics", description = "Returns empty stats - automatic threat intelligence is disabled")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalThreats", 0);
        stats.put("activeThreats", 0);
        stats.put("databaseSize", 0);
        stats.put("lastUpdate", null);
        stats.put("enabled", false);
        stats.put("message", "Automatic threat intelligence is disabled. Manage blacklist manually.");
        return ResponseEntity.ok(stats);
    }

    @PostMapping("/update")
    @Operation(summary = "Update threat intelligence", description = "No-op - automatic updates are disabled")
    public ResponseEntity<Map<String, String>> update() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "disabled");
        response.put("message", "Automatic threat intelligence is disabled. Please manage your blacklist manually via the Blacklist page.");
        return ResponseEntity.ok(response);
    }
}
