package com.bphuc246.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bphuc246.entity.Player.PlayerEntity;

public interface PlayerRepository extends JpaRepository<PlayerEntity, Long> {
    Optional<PlayerEntity> findByEmail(String email);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);
    List<PlayerEntity> findAll();
    Optional<PlayerEntity> findByUsername(String username);
}
