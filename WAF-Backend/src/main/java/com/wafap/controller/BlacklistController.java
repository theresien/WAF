package com.wafap.controller;

import com.wafap.model.BlacklistedDomain;
import com.wafap.repository.BlacklistedDomainRepository;
import com.wafap.service.IptablesGateway;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.wafap.dto.BlacklistRequest;
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
    private final IptablesGateway iptablesGateway;

    public BlacklistController(BlacklistedDomainRepository blacklistRepo, IptablesGateway iptablesGateway) {
        this.blacklistRepo = blacklistRepo;
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
        String domain = request.domain().toLowerCase();
        Integer severity = request.severity() != null ? request.severity() : 3;

        if (blacklistRepo.existsByDomain(domain)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Domain already blacklisted"));
        }

        BlacklistedDomain blacklisted = new BlacklistedDomain(domain, severity);
        blacklistRepo.save(blacklisted);
        updateDnsmasqBlacklist();

        return ResponseEntity.ok(Map.of("message", "Domain blacklisted", "domain", blacklisted));
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
        try (PrintWriter writer = new PrintWriter(new FileWriter("/etc/dnsmasq.d/blacklist.conf"))) {
            long count = 0;
            for (BlacklistedDomain domain : blacklistRepo.findAll()) {
                String sanitized = domain.getDomain().replaceAll("[^a-zA-Z0-9-_.]", "");
                writer.println("address=/" + sanitized + "/0.0.0.0");
                count++;
            }
            logger.info("Updated dnsmasq blacklist with {} domains", count);
            iptablesGateway.reloadFirewall();
        } catch (Exception e) {
            logger.error("Failed to update dnsmasq blacklist: {}", e.getMessage());
        }
    }
}
