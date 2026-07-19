package com.bphuc246.Repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bphuc246.entity.PlayerStats.PlayerMoveStatsEntity;

public interface PlayerMoveStatsRepository extends JpaRepository<PlayerMoveStatsEntity, Long> {
    Optional<PlayerMoveStatsEntity> findByPlayerId(Long playerId);
}