package com.bphuc246.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.bphuc246.dto.Response.CalibrationBucketResponse;
import com.bphuc246.entity.Match.MatchEntity;

public interface MatchRepository extends JpaRepository<MatchEntity, Long> {
    Optional<MatchEntity> findByIdAndStatusNot(Long id, com.bphuc246.entity.Match.MatchStatus status);

        @Query("""
        SELECT new com.bphuc246.dto.Response.CalibrationBucketResponse(
            CAST(FLOOR(m.predictedWinProbability * 10) AS integer),
            COUNT(m),
            AVG(CASE WHEN m.winnerId = m.playerOneId THEN 1.0 ELSE 0.0 END),
            AVG(m.predictedWinProbability),
            AVG(m.predictedUnfairness)
        )
        FROM MatchEntity m
        WHERE m.status = 'FINISHED'
            AND m.queueType = 'RANKED'
            AND m.predictedWinProbability IS NOT NULL
            AND m.winnerId <> -1
        GROUP BY CAST(FLOOR(m.predictedWinProbability * 10) AS integer)
        ORDER BY CAST(FLOOR(m.predictedWinProbability * 10) AS integer)
        """)
    List<CalibrationBucketResponse> getCalibrationBuckets();

    @Query("""
        SELECT COUNT(m) FROM MatchEntity m
        WHERE m.status = 'FINISHED' AND m.queueType = 'RANKED'
        """)
    long countRankedFinishedMatches();

}