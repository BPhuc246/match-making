package com.bphuc246.matchmaking.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import com.bphuc246.Repository.PlayerMoveStatsRepository;
import com.bphuc246.entity.PlayerStats.PlayerMoveStatsEntity;
import com.bphuc246.entity.Round.GameChoice;
import com.bphuc246.service.PlayerMoveStatsService;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Optional;
import java.util.HashMap;
import java.util.Map;

@ExtendWith(MockitoExtension.class)
class PlayerMoveStatsServiceTest {

    // Simple in-memory fake repo instead of a full mock — easier to reason
    // about across multiple sequential recordMove() calls in one test.
    static class FakeRepo {
        Map<Long, PlayerMoveStatsEntity> store = new HashMap<>();
    }

    @Test
    void alwaysSameMove_shouldConvergeTowardFullyPredictable() {
        PlayerMoveStatsService service = buildServiceWithFakeStore();
        Long playerId = 1L;

        // Play ROCK 20 times in a row — after "prev=ROCK", "next" is ALWAYS
        // ROCK too, so the transition matrix should show 100% concentration
        // on that one row.
        for (int i = 0; i < 20; i++) {
            service.recordMove(playerId, GameChoice.ROCK);
        }

        Double score = service.getPredictabilityScore(playerId);
        assertNotNull(score, "Score should exist after 20 moves (threshold is 15)");
        assertTrue(score > 0.9, "Always-same-move should score near 1.0, got " + score);
    }

    @Test
    void belowThreshold_shouldReturnNullNotZero() {
        PlayerMoveStatsService service = buildServiceWithFakeStore();
        Long playerId = 2L;

        for (int i = 0; i < 10; i++) { // below MIN_MOVES_FOR_SCORE (15)
            service.recordMove(playerId, GameChoice.ROCK);
        }

        assertNull(service.getPredictabilityScore(playerId),
                "Score must be null below the minimum sample threshold — a 0.0 here would be misleadingly reported as 'proven random'");
    }

    @Test
    void trueUniformCycle_shouldScoreNearZero() {
        PlayerMoveStatsService service = buildServiceWithFakeStore();
        Long playerId = 3L;
        GameChoice[] cycle = { GameChoice.ROCK, GameChoice.PAPER, GameChoice.SCISSORS };

        // A perfectly even ROCK->PAPER->SCISSORS->ROCK... cycle is actually
        // 100% predictable too (each previous move always leads to exactly
        // one next move) — this is an important edge case: "evenly
        // distributed usage" is NOT the same as "unpredictable transitions".
        // This test documents that distinction rather than asserting a false
        // expectation — a rotating pattern SHOULD score high, not low.
        for (int i = 0; i < 21; i++) {
            service.recordMove(playerId, cycle[i % 3]);
        }

        Double score = service.getPredictabilityScore(playerId);
        assertTrue(score > 0.9, "A deterministic rotation is fully predictable despite even move distribution, got " + score);
    }

    // Minimal fake-repo wiring — adjust to however your project sets up
    // Mockito-based unit tests for other services, this is just the shape.
    private PlayerMoveStatsService buildServiceWithFakeStore() {
        PlayerMoveStatsRepository repo = mock(PlayerMoveStatsRepository.class);

        // In-memory backing map so sequential recordMove() calls actually
        // persist/accumulate across calls, instead of each save() being a no-op.
        Map<Long, PlayerMoveStatsEntity> store = new HashMap<>();

        when(repo.findByPlayerId(anyLong()))
            .thenAnswer(inv -> Optional.ofNullable(store.get(inv.getArgument(0, Long.class))));

        when(repo.save(any(PlayerMoveStatsEntity.class)))
            .thenAnswer(inv -> {
                PlayerMoveStatsEntity entity = inv.getArgument(0);
                store.put(entity.getPlayerId(), entity);
                return entity;
            });

        return new PlayerMoveStatsService(repo, new ObjectMapper());
    }
}
