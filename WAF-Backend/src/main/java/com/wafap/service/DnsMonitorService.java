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
    private static final Pattern DNS_PATTERN = Pattern.compile("query\\[A+\\] (\\S+) from (\\d+\\.\\d+\\.\\d+\\.\\d+)");

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
            raf.seek(lastPosition);
            String line;
            while ((line = raf.readLine()) != null) {
                processDnsQuery(line);
            }
            lastPosition = raf.getFilePointer();
        } catch (Exception e) {
            logger.debug("DNS log not available: {}", e.getMessage());
        }
    }

    private void processDnsQuery(String line) {
        Matcher matcher = DNS_PATTERN.matcher(line);
        if (!matcher.find()) return;

        String domain = matcher.group(1);
        String sourceIp = matcher.group(2);

        blacklistRepo.findAll().forEach(blacklisted -> {
            if (domain.contains(blacklisted.getDomain())) {
                deviceRepository.findByIpAddress(sourceIp).ifPresent(device -> {
                    Event event = new Event(device, EventType.HTTPS_DANGEROUS_SITE);
                    event.setSourceIp(sourceIp);
                    event.setRequestUri(domain);
                    event.setSeverity(blacklisted.getSeverity());

                    // Security: Use ObjectMapper to build JSON safely
                    try {
                        var json = objectMapper.createObjectNode();
                        json.put("domain", domain);
                        json.put("blocked", true);
                        event.setMessageJson(objectMapper.writeValueAsString(json));
                    } catch (Exception e) {
                        logger.error("Failed to create JSON for DNS event", e);
                        event.setMessageJson("{\"domain\":\"unknown\",\"blocked\":true}");
                    }

                    eventRepository.save(event);

                    logger.warn("Dangerous site accessed: {} by device {}", domain, device.getMacAddress());

                    if (blacklisted.getSeverity() >= 4) {
                        policyService.banDevice(device, "Accessed dangerous site: " + domain, null);
                    }
                });
            }
        });
    }
}
