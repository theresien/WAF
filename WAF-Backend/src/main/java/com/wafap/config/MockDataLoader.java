package com.wafap.config;

import com.wafap.model.Device;
import com.wafap.model.DeviceStatus;
import com.wafap.model.Event;
import com.wafap.model.EventType;
import com.wafap.repository.DeviceRepository;
import com.wafap.repository.EventRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.time.LocalDateTime;
import java.util.Random;

@Configuration
@Profile("mock") // Changed from "dev" to "mock" - only loads when explicitly enabled
public class MockDataLoader {

    @Bean
    CommandLineRunner loadMockData(DeviceRepository deviceRepository, EventRepository eventRepository) {
        return args -> {
            // Delete old mock events
            eventRepository.findAll().stream()
                .filter(e -> e.getEventType() == EventType.HTTP || 
                            e.getEventType() == EventType.HTTP_ATTACK || 
                            e.getEventType() == EventType.SSH_FAILED_AUTH)
                .forEach(eventRepository::delete);

            Random random = new Random();
            String[] ips = {"192.168.1.100", "192.168.1.101", "192.168.1.102"};
            String[] macs = {"aa:bb:cc:dd:ee:01", "aa:bb:cc:dd:ee:02", "aa:bb:cc:dd:ee:03"};
            String[] hostnames = {"laptop-test", "smartphone-demo", "tablet-mock"};
            String[] vendors = {"Dell", "Samsung", "Apple"};
            
            for (int i = 0; i < 3; i++) {
                final int index = i;
                final String mac = macs[index];
                final String ip = ips[index];
                Device device = deviceRepository.findByMacAddress(mac)
                    .orElseGet(() -> {
                        Device d = new Device(mac, ip);
                        d.setHostname(hostnames[index]);
                        d.setVendor(vendors[index]);
                        d.setStatus(DeviceStatus.MONITORED);
                        return deviceRepository.save(d);
                    });

                // HTTP events
                for (int j = 0; j < 10; j++) {
                    Event httpEvent = new Event(device, EventType.HTTP);
                    httpEvent.setTimestamp(LocalDateTime.now().minusHours(random.nextInt(24)));
                    httpEvent.setSourceIp(ip);
                    httpEvent.setRequestUri("/api/data");
                    httpEvent.setUserAgent("Mozilla/5.0");
                    httpEvent.setMessageJson("{\"method\":\"GET\",\"path\":\"/api/data\",\"status\":200}");
                    eventRepository.save(httpEvent);
                }

                // HTTP_ATTACK events
                for (int j = 0; j < 5; j++) {
                    Event attackEvent = new Event(device, EventType.HTTP_ATTACK);
                    attackEvent.setTimestamp(LocalDateTime.now().minusHours(random.nextInt(24)));
                    attackEvent.setSourceIp(ip);
                    attackEvent.setRequestUri("/admin/login");
                    attackEvent.setUserAgent("sqlmap/1.0");
                    attackEvent.setSeverity(4);
                    attackEvent.setRuleId("942100");
                    attackEvent.setMessageJson("{\"attack_type\":\"SQL Injection\",\"blocked\":true}");
                    eventRepository.save(attackEvent);
                }

                // SSH_FAILED_AUTH events
                for (int j = 0; j < 8; j++) {
                    Event sshEvent = new Event(device, EventType.SSH_FAILED_AUTH);
                    sshEvent.setTimestamp(LocalDateTime.now().minusHours(random.nextInt(24)));
                    sshEvent.setSourceIp(ip);
                    sshEvent.setSeverity(3);
                    sshEvent.setMessageJson("{\"username\":\"admin\",\"attempts\":" + (j + 1) + "}");
                    eventRepository.save(sshEvent);
                }
            }
        };
    }
}
