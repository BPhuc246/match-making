package com.bphuc246.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.bphuc246.entity.QueueEntry.QueueEntryEntity;
import com.bphuc246.entity.QueueEntry.QueueStatus;
import com.bphuc246.entity.QueueEntry.QueueType;

import jakarta.persistence.LockModeType;

public interface QueueEntryRepository extends JpaRepository<QueueEntryEntity, Long> {

    Optional<QueueEntryEntity> findByPlayerIdAndQueueTypeAndQueueStatus(
            Long playerId, QueueType queueType, QueueStatus queueStatus);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT q FROM QueueEntryEntity q
        WHERE q.queueType = :queueType
          AND q.queueStatus = :status
          AND q.playerId <> :playerId
        ORDER BY q.joinedAt ASC
        """)
    List<QueueEntryEntity> findWaitingOpponents(
            @Param("queueType") QueueType queueType,
            @Param("status") QueueStatus status,
            @Param("playerId") Long playerId,
            Pageable pageable);
}
