package com.bphuc246.matchmaking.service;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.bphuc246.Repository.PlayerMoveStatsRepository;
import com.bphuc246.entity.Round.GameChoice;
import com.bphuc246.service.PlayerMoveStatsService;
import com.fasterxml.jackson.databind.ObjectMapper;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE) // use our H2 config, not an auto-picked one
@Import(PlayerMoveStatsService.class)
@ActiveProfiles("test")
class PlayerMoveStatsServiceIntegrationTest {

    @Autowired
    PlayerMoveStatsRepository repository;

    private PlayerMoveStatsService service;

    @BeforeEach
    void setUp() {
        service = new PlayerMoveStatsService(repository, new ObjectMapper());
    }

    @Test
    void belowThreshold_shouldReturnNullNotZero() {
        Long playerId = 1L;
        for (int i = 0; i < 10; i++) { // MIN_MOVES_FOR_SCORE is 15
            service.recordMove(playerId, GameChoice.ROCK);
        }

        assertNull(service.getPredictabilityScore(playerId),
                "Score must be null below the minimum sample threshold — a 0.0 here would falsely read as 'proven random'");
    }

    @Test
    void exactlyAtThreshold_shouldProduceAScore() {
        Long playerId = 2L;
        for (int i = 0; i < 15; i++) {
            service.recordMove(playerId, GameChoice.ROCK);
        }

        assertNotNull(service.getPredictabilityScore(playerId), "Score should exist right at the threshold");
    }

    @Test
    void alwaysSameMove_shouldConvergeTowardFullyPredictable() {
        Long playerId = 3L;
        for (int i = 0; i < 20; i++) {
            service.recordMove(playerId, GameChoice.ROCK);
        }

        Double score = service.getPredictabilityScore(playerId);
        assertNotNull(score);
        assertTrue(score > 0.9, "Always-same-move should score near 1.0, got " + score);
    }

    @Test
    void deterministicRotation_shouldAlsoScoreHigh() {
        // Documents an important edge case: an evenly-distributed but fully
        // predictable pattern (ROCK->PAPER->SCISSORS->ROCK...) is NOT the
        // same as true randomness, even though each move appears equally
        // often overall. Predictability is about the TRANSITION, not the
        // raw frequency distribution.
        Long playerId = 4L;
        GameChoice[] cycle = { GameChoice.ROCK, GameChoice.PAPER, GameChoice.SCISSORS };
        for (int i = 0; i < 21; i++) {
            service.recordMove(playerId, cycle[i % 3]);
        }

        Double score = service.getPredictabilityScore(playerId);
        assertNotNull(score);
        assertTrue(score > 0.9, "A deterministic rotation is fully predictable despite even move distribution, got " + score);
    }

    @Test
    void alternatingTwoMoves_shouldAlsoBeFullyPredictable() {
        // ROCK, PAPER, ROCK, PAPER... — never plays SCISSORS at all, and each
        // previous move always leads to exactly one next move.
        Long playerId = 5L;
        for (int i = 0; i < 20; i++) {
            service.recordMove(playerId, i % 2 == 0 ? GameChoice.ROCK : GameChoice.PAPER);
        }

        Double score = service.getPredictabilityScore(playerId);
        assertNotNull(score);
        assertTrue(score > 0.9, "Strict alternation is fully predictable, got " + score);
    }

    @Test
    void twoDifferentPlayers_shouldHaveIndependentScores() {
        // Guards against a shared-state bug where one player's moves leak
        // into another's transition matrix.
        Long predictablePlayer = 6L;
        Long mixedPlayer = 7L;

        for (int i = 0; i < 20; i++) {
            service.recordMove(predictablePlayer, GameChoice.ROCK);
        }

        GameChoice[] mixed = { GameChoice.ROCK, GameChoice.ROCK, GameChoice.PAPER, GameChoice.SCISSORS,
                                GameChoice.PAPER, GameChoice.ROCK, GameChoice.SCISSORS, GameChoice.SCISSORS,
                                GameChoice.PAPER, GameChoice.ROCK, GameChoice.PAPER, GameChoice.SCISSORS,
                                GameChoice.ROCK, GameChoice.PAPER, GameChoice.SCISSORS, GameChoice.ROCK,
                                GameChoice.PAPER, GameChoice.SCISSORS, GameChoice.ROCK, GameChoice.PAPER };
        for (GameChoice c : mixed) {
            service.recordMove(mixedPlayer, c);
        }

        double predictableScore = service.getPredictabilityScore(predictablePlayer);
        double mixedScore = service.getPredictabilityScore(mixedPlayer);

        assertTrue(predictableScore > mixedScore,
                "Always-ROCK player should score higher than a mixed player. predictable=" + predictableScore + " mixed=" + mixedScore);
    }

    @Test
    void persistsAcrossServiceInstances() {
        // Confirms state actually lands in the DB, not just an in-memory
        // field on the service instance — recreate the service object
        // between writes and reads to catch a "forgot to actually save()" bug.
        Long playerId = 8L;
        for (int i = 0; i < 20; i++) {
            service.recordMove(playerId, GameChoice.ROCK);
        }

        PlayerMoveStatsService freshService = new PlayerMoveStatsService(repository, new ObjectMapper());
        Double score = freshService.getPredictabilityScore(playerId);

        assertNotNull(score, "Score should be readable from a completely new service instance, proving it's DB-persisted");
        assertTrue(score > 0.9);
    }
}
