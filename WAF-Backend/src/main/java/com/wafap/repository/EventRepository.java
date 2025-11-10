package com.wafap.repository;

import com.wafap.model.Device;
import com.wafap.model.Event;
import com.wafap.model.EventType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    Page<Event> findByEventType(EventType eventType, Pageable pageable);

    Page<Event> findByDevice(Device device, Pageable pageable);

    Page<Event> findByDeviceAndEventType(Device device, EventType eventType, Pageable pageable);

    @Query("SELECT e FROM Event e WHERE e.timestamp >= :start AND e.timestamp <= :end ORDER BY e.timestamp DESC")
    Page<Event> findByTimestampBetween(
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end,
        Pageable pageable
    );

    @Query("SELECT e FROM Event e WHERE e.eventType = :eventType AND e.timestamp >= :since ORDER BY e.timestamp DESC")
    List<Event> findRecentByType(@Param("eventType") EventType eventType, @Param("since") LocalDateTime since);

    @Query("SELECT e FROM Event e WHERE e.device.id = :deviceId AND e.eventType = :eventType AND e.timestamp >= :since")
    List<Event> findByDeviceIdAndEventTypeSince(
        @Param("deviceId") Long deviceId,
        @Param("eventType") EventType eventType,
        @Param("since") LocalDateTime since
    );

    @Query("SELECT COUNT(e) FROM Event e WHERE e.device.id = :deviceId AND e.eventType = 'SSH_FAILED_AUTH' AND e.timestamp >= :since")
    long countFailedSshAttempts(@Param("deviceId") Long deviceId, @Param("since") LocalDateTime since);

    @Query("SELECT e FROM Event e ORDER BY e.timestamp DESC")
    Page<Event> findAllOrderByTimestampDesc(Pageable pageable);

    List<Event> findByRequestUriContaining(String domain);

    void deleteByTimestampBefore(LocalDateTime timestamp);
}
