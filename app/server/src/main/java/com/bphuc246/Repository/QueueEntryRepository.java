package com.bphuc246.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.bphuc246.entity.QueueEntry.QueueEntryEntity;
import com.bphuc246.entity.QueueEntry.QueueStatus;
import com.bphuc246.entity.QueueEntry.QueueType;

import jakarta.persistence.LockModeType;

public interface QueueEntryRepository extends JpaRepository<QueueEntryEntity, Long> {

    Optional<QueueEntryEntity> findByPlayerIdAndQueueTypeAndQueueStatus(
            Long playerId, QueueType queueType, QueueStatus queueStatus);
    Optional<QueueEntryEntity> findTopByPlayerIdAndQueueTypeOrderByJoinedAtDesc(Long playerId, QueueType queueType);
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

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT q FROM QueueEntryEntity q
        WHERE q.queueType = :queueType
          AND q.queueStatus = :status
          AND q.playerId <> :playerId
          AND ABS(q.ratingAtQueue - :myRating) <= q.searchRange
          AND ABS(q.ratingAtQueue - :myRating) <= :mySearchRange
        ORDER BY q.joinedAt ASC
        """)
    List<QueueEntryEntity> findWaitingOpponentsInRange(
            @Param("queueType") QueueType queueType,
            @Param("status") QueueStatus status,
            @Param("playerId") Long playerId,
            @Param("myRating") Double myRating,
            @Param("mySearchRange") Integer mySearchRange,
            Pageable pageable);
            
    /** Used by the widening scheduled job */
    List<QueueEntryEntity> findByQueueStatusAndQueueType(QueueStatus status, QueueType queueType);
    // Cleanup: remove a specific player's queue record tied to a specific match once they leave the room
    @Modifying
    @Query("DELETE FROM QueueEntryEntity q WHERE q.playerId = :playerId AND q.matchId = :matchId")
    int deleteByPlayerIdAndMatchId(@Param("playerId") Long playerId, @Param("matchId") Long matchId);

    // Fallback cleanup: remove both entries for a match at once (e.g. when match ends/cancels entirely)
    @Modifying
    @Query("DELETE FROM QueueEntryEntity q WHERE q.matchId = :matchId")
    int deleteByMatchId(@Param("matchId") Long matchId);
}
