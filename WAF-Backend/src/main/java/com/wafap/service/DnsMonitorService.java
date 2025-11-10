package com.wafap.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wafap.model.BlacklistedDomain;
import com.wafap.model.Device;
import com.wafap.model.Event;
import com.wafap.model.EventType;
import com.wafap.repository.BlacklistedDomainRepository;
import com.wafap.repository.DeviceRepository;
import com.wafap.repository.EventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.RandomAccessFile;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class DnsMonitorService {

    private static final Logger logger = LoggerFactory.getLogger(DnsMonitorService.class);
    private static final Pattern DNS_PATTERN = Pattern.compile("query\\[[A-Z]+\\] (\\S+) from (\\d+\\.\\d+\\.\\d+\\.\\d+)");

    private final BlacklistedDomainRepository blacklistRepo;
    private final DeviceRepository deviceRepository;
    private final EventRepository eventRepository;
    private final PolicyService policyService;
    private final ObjectMapper objectMapper;

    @Value("${wafap.dns.log-file:/var/log/dnsmasq-queries.log}")
    private String dnsLogFile;

    private long lastPosition = 0;

    public DnsMonitorService(BlacklistedDomainRepository blacklistRepo,
                            DeviceRepository deviceRepository,
                            EventRepository eventRepository,
                            PolicyService policyService,
                            ObjectMapper objectMapper) {
        this.blacklistRepo = blacklistRepo;
        this.deviceRepository = deviceRepository;
        this.eventRepository = eventRepository;
        this.policyService = policyService;
        this.objectMapper = objectMapper;
    }

    @Scheduled(fixedRate = 5000)
    public void monitorDnsQueries() {
        try (RandomAccessFile raf = new RandomAccessFile(dnsLogFile, "r")) {
            long fileLength = raf.length();
            if (lastPosition > fileLength) {
                lastPosition = 0; // File was rotated
            }
            raf.seek(lastPosition);
            String line;
            int linesProcessed = 0;
            while ((line = raf.readLine()) != null) {
                processDnsQuery(line);
                linesProcessed++;
            }
            lastPosition = raf.getFilePointer();
            if (linesProcessed > 0) {
                logger.debug("Processed {} DNS log lines", linesProcessed);
            }
        } catch (Exception e) {
            logger.warn("DNS log not available: {}", e.getMessage());
        }
    }

    private void processDnsQuery(String line) {
        Matcher matcher = DNS_PATTERN.matcher(line);
        if (!matcher.find()) return;

        String domain = matcher.group(1);
        String sourceIp = matcher.group(2);
        
        logger.debug("DNS Query: {} from {}", domain, sourceIp);

        blacklistRepo.findAll().forEach(blacklisted -> {
            if (domain.contains(blacklisted.getDomain()) || blacklisted.getDomain().contains(domain)) {
                logger.warn("Blacklisted domain accessed: {} from IP {}", domain, sourceIp);
                
                var deviceOpt = deviceRepository.findByIpAddress(sourceIp);
                Device device = deviceOpt.orElse(null);
                
                Event event = new Event(device, EventType.HTTPS_DANGEROUS_SITE);
                event.setSourceIp(sourceIp);
                event.setRequestUri(domain);
                event.setRuleId("BLACKLIST_DOMAIN");
                event.setSeverity(blacklisted.getSeverity());

                try {
                    var json = objectMapper.createObjectNode();
                    json.put("domain", domain);
                    json.put("blocked", true);
                    json.put("attack_type", "Blacklisted Domain Access");
                    event.setMessageJson(objectMapper.writeValueAsString(json));
                } catch (Exception e) {
                    logger.error("Failed to create JSON for DNS event", e);
                    event.setMessageJson("{\"domain\":\"unknown\",\"blocked\":true,\"attack_type\":\"Blacklisted Domain\"}");
                }

                eventRepository.save(event);
                logger.info("Event created for blacklisted domain: {} from {} (device: {})", 
                    domain, sourceIp, device != null ? device.getMacAddress() : "unknown");

                if (device != null && blacklisted.getSeverity() >= 4) {
                    policyService.banDevice(device, "Accessed dangerous site: " + domain, null);
                }
            }
        });
    }
}
