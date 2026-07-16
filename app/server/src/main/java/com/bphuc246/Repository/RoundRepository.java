package com.bphuc246.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bphuc246.entity.Round.RoundEntity;
import com.bphuc246.entity.Round.RoundStatus;

public interface RoundRepository extends JpaRepository<RoundEntity, Long> {

    List<RoundEntity> findByMatchIdOrderByRoundNumberAsc(Long matchId);

    Optional<RoundEntity> findByMatchIdAndStatus(Long matchId, RoundStatus status);

    Optional<RoundEntity> findByMatchIdAndRoundNumber(Long matchId, Integer roundNumber);
}