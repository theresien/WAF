package com.wafap.controller;

import com.wafap.service.LogIngesterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/logs")
@Tag(name = "Logs", description = "Log ingestion endpoints")
public class LogController {

    private static final Logger logger = LoggerFactory.getLogger(LogController.class);

    private final LogIngesterService logIngesterService;

    public LogController(LogIngesterService logIngesterService) {
        this.logIngesterService = logIngesterService;
    }

    @PostMapping("/modsecurity")
    @Operation(
        summary = "Ingest ModSecurity log",
        description = "Receives and processes JSON logs from ModSecurity WAF"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Log processed successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid log format"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<Map<String, String>> ingestModSecurityLog(@RequestBody String jsonLog) {
        try {
            logIngesterService.ingestModSecurityLog(jsonLog);
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Log ingested successfully"
            ));
        } catch (Exception e) {
            logger.error("Failed to ingest ModSecurity log", e);
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/health")
    @Operation(summary = "Health check", description = "Check if the log ingestion service is operational")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "healthy",
            "service", "log-ingestion"
        ));
    }
}
