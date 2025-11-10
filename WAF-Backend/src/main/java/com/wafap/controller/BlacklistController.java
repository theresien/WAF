package com.wafap.controller;

import com.wafap.model.BlacklistedDomain;
import com.wafap.repository.BlacklistedDomainRepository;
import com.wafap.repository.EventRepository;
import com.wafap.service.IptablesGateway;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.wafap.dto.BlacklistRequest;
import com.wafap.dto.UpdateSeverityRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.FileWriter;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/blacklist")
@Tag(name = "Blacklist", description = "Domain blacklist management")
public class BlacklistController {

    private static final Logger logger = LoggerFactory.getLogger(BlacklistController.class);
    private final BlacklistedDomainRepository blacklistRepo;
    private final EventRepository eventRepository;
    private final IptablesGateway iptablesGateway;

    public BlacklistController(BlacklistedDomainRepository blacklistRepo, EventRepository eventRepository, IptablesGateway iptablesGateway) {
        this.blacklistRepo = blacklistRepo;
        this.eventRepository = eventRepository;
        this.iptablesGateway = iptablesGateway;
    }

    @GetMapping("/domains")
    @Operation(summary = "Get all blacklisted domains")
    public ResponseEntity<List<BlacklistedDomain>> getAllDomains() {
        return ResponseEntity.ok(blacklistRepo.findAll());
    }

    @PostMapping("/domains")
    @Operation(summary = "Add domain to blacklist")
    public ResponseEntity<?> addDomain(@Valid @RequestBody BlacklistRequest request) {
        String domain = extractDomain(request.domain()).toLowerCase();
        Integer severity = request.severity() != null ? request.severity() : 3;

        if (blacklistRepo.existsByDomain(domain)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Domain already blacklisted"));
        }

        BlacklistedDomain blacklisted = new BlacklistedDomain(domain, severity);
        blacklistRepo.save(blacklisted);
        updateDnsmasqBlacklist();

        return ResponseEntity.ok(Map.of("message", "Domain blacklisted", "domain", blacklisted));
    }

    private String extractDomain(String input) {
        String domain = input.trim();
        domain = domain.replaceAll("^https?://", "");
        domain = domain.replaceAll("^www\\.", "");
        domain = domain.replaceAll("/.*$", "");
        domain = domain.replaceAll(":\\d+$", "");
        return domain;
    }

    @PutMapping("/domains/{domain}")
    @Operation(summary = "Update domain severity")
    public ResponseEntity<?> updateDomainSeverity(
            @PathVariable 
            @Pattern(regexp = "^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]$") 
            String domain,
            @Valid @RequestBody UpdateSeverityRequest request) {
        return blacklistRepo.findByDomain(domain.toLowerCase())
            .map(blacklisted -> {
                Integer oldSeverity = blacklisted.getSeverity();
                blacklisted.setSeverity(request.severity());
                blacklistRepo.save(blacklisted);
                
                // Mettre à jour tous les événements liés à ce domaine
                var events = eventRepository.findByRequestUriContaining(domain.toLowerCase());
                int updatedCount = 0;
                for (var event : events) {
                    event.setSeverity(request.severity());
                    eventRepository.save(event);
                    updatedCount++;
                }
                
                logger.info("Updated severity for domain {} from {} to {} ({} events updated)", 
                    domain, oldSeverity, blacklisted.getSeverity(), updatedCount);
                
                return ResponseEntity.ok(Map.of(
                    "message", "Domain severity updated", 
                    "domain", blacklisted,
                    "eventsUpdated", updatedCount
                ));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/domains/{domain}")
    @Operation(summary = "Remove domain from blacklist")
    public ResponseEntity<?> removeDomain(
            @PathVariable 
            @Pattern(regexp = "^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]$") 
            String domain) {
        return blacklistRepo.findByDomain(domain.toLowerCase())
            .map(blacklisted -> {
                blacklistRepo.delete(blacklisted);
                updateDnsmasqBlacklist();
                return ResponseEntity.ok(Map.of("message", "Domain removed from blacklist"));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    private void updateDnsmasqBlacklist() {
        String blacklistFile = "/etc/dnsmasq.d/blacklist.conf";
        try (PrintWriter writer = new PrintWriter(new FileWriter(blacklistFile))) {
            long count = 0;
            for (BlacklistedDomain domain : blacklistRepo.findAll()) {
                String sanitized = domain.getDomain().replaceAll("[^a-zA-Z0-9-_.]", "");
                writer.println("address=/" + sanitized + "/0.0.0.0");
                count++;
            }
            logger.info("Updated dnsmasq blacklist with {} domains", count);
            iptablesGateway.reloadFirewall();
        } catch (java.io.FileNotFoundException e) {
            logger.error("Blacklist file not found or no permission: {}. Run: sudo touch {} && sudo chown $USER {}", 
                e.getMessage(), blacklistFile, blacklistFile);
            throw new RuntimeException("Cannot write to blacklist file. Check permissions.");
        } catch (java.io.IOException e) {
            logger.error("IO error writing blacklist: {}", e.getMessage());
            throw new RuntimeException("Failed to write blacklist file: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Failed to update dnsmasq blacklist: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to update blacklist: " + e.getMessage());
        }
    }
}
