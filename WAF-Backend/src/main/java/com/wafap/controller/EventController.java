package com.wafap.controller;

import com.wafap.dto.EventDTO;
import com.wafap.model.EventType;
import com.wafap.repository.EventRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/events")
@Tag(name = "Events", description = "Security events and attack logs")
public class EventController {

    private final EventRepository eventRepository;

    public EventController(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    @GetMapping
    @Operation(
        summary = "Get all events",
        description = "Retrieve paginated list of all security events"
    )
    public ResponseEntity<Page<EventDTO>> getAllEvents(
            @PageableDefault(size = 50, sort = "timestamp", direction = Sort.Direction.DESC)
            Pageable pageable) {

        Page<EventDTO> events = eventRepository
                .findAllOrderByTimestampDesc(pageable)
                .map(EventDTO::fromEntity);

        return ResponseEntity.ok(events);
    }

    @GetMapping("/type/{eventType}")
    @Operation(
        summary = "Get events by type",
        description = "Retrieve events filtered by event type"
    )
    public ResponseEntity<Page<EventDTO>> getEventsByType(
            @PathVariable
            @Parameter(description = "Event type (HTTP_ATTACK, SSH_FAILED_AUTH, etc.)")
            EventType eventType,
            @PageableDefault(size = 50, sort = "timestamp", direction = Sort.Direction.DESC)
            Pageable pageable) {

        Page<EventDTO> events = eventRepository
                .findByEventType(eventType, pageable)
                .map(EventDTO::fromEntity);

        return ResponseEntity.ok(events);
    }

    @GetMapping("/device/{deviceId}")
    @Operation(
        summary = "Get events for a device",
        description = "Retrieve all events associated with a specific device"
    )
    public ResponseEntity<Page<EventDTO>> getEventsByDevice(
            @PathVariable Long deviceId,
            @PageableDefault(size = 50, sort = "timestamp", direction = Sort.Direction.DESC)
            Pageable pageable) {

        var device = new com.wafap.model.Device();
        device.setId(deviceId);

        Page<EventDTO> events = eventRepository
                .findByDevice(device, pageable)
                .map(EventDTO::fromEntity);

        return ResponseEntity.ok(events);
    }

    @GetMapping("/{id}")
    @Operation(
        summary = "Get event by ID",
        description = "Retrieve detailed information about a specific event"
    )
    public ResponseEntity<EventDTO> getEventById(@PathVariable Long id) {
        return eventRepository.findById(id)
                .map(EventDTO::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
