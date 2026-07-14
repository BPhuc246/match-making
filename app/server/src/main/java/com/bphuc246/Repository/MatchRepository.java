package com.bphuc246.Repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bphuc246.entity.Match.MatchEntity;

public interface MatchRepository extends JpaRepository<MatchEntity, Long> {
    Optional<MatchEntity> findByIdAndStatusNot(Long id, com.bphuc246.entity.Match.MatchStatus status);
}