package com.wafap.repository;

import com.wafap.model.Device;
import com.wafap.model.DeviceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceRepository extends JpaRepository<Device, Long> {

    Optional<Device> findByMacAddress(String macAddress);

    Optional<Device> findByIpAddress(String ipAddress);

    List<Device> findByStatus(DeviceStatus status);

    List<Device> findByStatusIn(List<DeviceStatus> statuses);

    @Query("SELECT d FROM Device d WHERE d.status = :status AND d.bannedUntil IS NOT NULL AND d.bannedUntil <= :now")
    List<Device> findExpiredBans(@Param("status") DeviceStatus status, @Param("now") LocalDateTime now);

    @Query("SELECT d FROM Device d WHERE d.lastSeen >= :since ORDER BY d.lastSeen DESC")
    List<Device> findRecentlyActive(@Param("since") LocalDateTime since);

    boolean existsByMacAddress(String macAddress);

    @Query("SELECT COUNT(d) FROM Device d WHERE d.status = :status")
    long countByStatus(@Param("status") DeviceStatus status);

    List<Device> findByIsConnected(Boolean isConnected);
}
