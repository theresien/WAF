package com.wafap.controller;

import com.wafap.dto.DeviceDTO;
import com.wafap.dto.EventDTO;
import com.wafap.repository.DeviceRepository;
import com.wafap.repository.EventRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/sse")
@Tag(name = "SSE", description = "Server-Sent Events for real-time updates")
public class SseController {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private final DeviceRepository deviceRepository;
    private final EventRepository eventRepository;
    private final ScheduledExecutorService executor = Executors.newScheduledThreadPool(1);

    public SseController(DeviceRepository deviceRepository, EventRepository eventRepository) {
        this.deviceRepository = deviceRepository;
        this.eventRepository = eventRepository;
        startHeartbeat();
    }

    @GetMapping(value = "/devices", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Stream device updates")
    public SseEmitter streamDevices() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));

        executor.scheduleAtFixedRate(() -> {
            try {
                List<DeviceDTO> devices = deviceRepository.findAll()
                    .stream()
                    .map(DeviceDTO::fromEntity)
                    .toList();
                emitter.send(SseEmitter.event().name("devices").data(devices));
            } catch (Exception e) {
                emitters.remove(emitter);
            }
        }, 0, 3, TimeUnit.SECONDS);

        return emitter;
    }

    @GetMapping(value = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Stream new events")
    public SseEmitter streamEvents() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));

        executor.scheduleAtFixedRate(() -> {
            try {
                List<EventDTO> events = eventRepository
                    .findAll(PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "timestamp")))
                    .getContent()
                    .stream()
                    .map(EventDTO::fromEntity)
                    .toList();
                emitter.send(SseEmitter.event().name("events").data(events));
            } catch (Exception e) {
                emitters.remove(emitter);
            }
        }, 0, 2, TimeUnit.SECONDS);

        return emitter;
    }

    private void startHeartbeat() {
        executor.scheduleAtFixedRate(() -> {
            List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();
            emitters.forEach(emitter -> {
                try {
                    emitter.send(SseEmitter.event().name("heartbeat").data("ping"));
                } catch (Exception e) {
                    deadEmitters.add(emitter);
                }
            });
            emitters.removeAll(deadEmitters);
        }, 0, 30, TimeUnit.SECONDS);
    }
}
