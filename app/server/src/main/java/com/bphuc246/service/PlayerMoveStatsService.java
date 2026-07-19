package com.bphuc246.service;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bphuc246.Repository.PlayerMoveStatsRepository;
import com.bphuc246.entity.PlayerStats.PlayerMoveStatsEntity;
import com.bphuc246.entity.Round.GameChoice;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PlayerMoveStatsService {

    // Below this many recorded moves, we don't trust the score enough to act
    // on it — too few samples make the transition matrix noisy (e.g. one
    // ROCK->PAPER out of one observation looks "100% predictable" but is
    // meaningless). 15 is a reasonable floor to start with; can be tuned.
    static final int MIN_MOVES_FOR_SCORE = 15;

    PlayerMoveStatsRepository statsRepository;
    ObjectMapper objectMapper;

    public record TransitionMatrix(Map<GameChoice, Map<GameChoice, Integer>> counts) {
        static TransitionMatrix empty() {
            Map<GameChoice, Map<GameChoice, Integer>> m = new EnumMap<>(GameChoice.class);
            for (GameChoice prev : GameChoice.values()) {
                Map<GameChoice, Integer> row = new EnumMap<>(GameChoice.class);
                for (GameChoice next : GameChoice.values()) row.put(next, 0);
                m.put(prev, row);
            }
            return new TransitionMatrix(m);
        }
    }

    @Transactional
    public void recordMove(Long playerId, GameChoice choice) {
        PlayerMoveStatsEntity stats = statsRepository.findByPlayerId(playerId)
                .orElseGet(() -> PlayerMoveStatsEntity.builder()
                        .playerId(playerId)
                        .transitionMatrixJson(serialize(TransitionMatrix.empty()))
                        .totalMoves(0)
                        .build());

        TransitionMatrix matrix = deserialize(stats.getTransitionMatrixJson());

        if (stats.getLastChoice() != null) {
            Map<GameChoice, Integer> row = matrix.counts().get(stats.getLastChoice());
            row.put(choice, row.get(choice) + 1);
        }

        stats.setTransitionMatrixJson(serialize(matrix));
        stats.setLastChoice(choice);
        stats.setTotalMoves(stats.getTotalMoves() + 1);
        stats.setLastUpdated(LocalDateTime.now());

        if (stats.getTotalMoves() >= MIN_MOVES_FOR_SCORE) {
            stats.setPredictabilityScore(computePredictability(matrix));
        }

        statsRepository.save(stats);
    }

    /**
     * Score in [0.0, 1.0]. 0.0 = indistinguishable from uniform random
     * (each next-move probability ≈ 1/3 regardless of previous move) —
     * the game-theoretically "safest" way to play. 1.0 = fully deterministic
     * (previous move always predicts the next one exactly).
     *
     * Method: for each "previous choice" row, take the most-frequent next
     * choice's share of that row (row's max count / row total). Average
     * these shares across rows, weighted by how many observations each row
     * has (rows with more data contribute more confidently). Then rescale
     * so that the random baseline (1/3) maps to 0 and full determinism (1.0)
     * maps to 1, instead of reporting the raw 1/3-to-1.0 range directly.
     */
    private double computePredictability(TransitionMatrix matrix) {
        double weightedMaxProbSum = 0;
        int totalWeight = 0;

        for (Map<GameChoice, Integer> row : matrix.counts().values()) {
            int rowTotal = row.values().stream().mapToInt(v -> v == null ? 0 : v).sum();
            if (rowTotal == 0) continue;

            int rowMax = row.values().stream().mapToInt(v -> v == null ? 0 : v).max().orElse(0);
            double rowMaxProb = (double) rowMax / rowTotal;

            weightedMaxProbSum += rowMaxProb * rowTotal;
            totalWeight += rowTotal;
        }

        if (totalWeight == 0) return 0.0;

        double avgMaxProb = weightedMaxProbSum / totalWeight;
        double baseline = 1.0 / 3.0;

        double score = (avgMaxProb - baseline) / (1.0 - baseline);
        return Math.max(0.0, Math.min(1.0, score));
    }

    /** Null if not enough data yet to trust the score — callers must handle this explicitly. */
    public Double getPredictabilityScore(Long playerId) {
        return statsRepository.findByPlayerId(playerId)
                .map((playerMoveStat) -> playerMoveStat.getPredictabilityScore())
                .orElse(null);
    }

    private String serialize(TransitionMatrix matrix) {
        try {
            return objectMapper.writeValueAsString(matrix.counts());
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize transition matrix", e);
        }
    }

    private TransitionMatrix deserialize(String json) {
        try {
            Map<GameChoice, Map<GameChoice, Integer>> counts = objectMapper.readValue(
                    json,
                    objectMapper.getTypeFactory().constructMapType(
                            EnumMap.class,
                            objectMapper.getTypeFactory().constructType(GameChoice.class),
                            objectMapper.getTypeFactory().constructMapType(
                                    EnumMap.class, GameChoice.class, Integer.class)));
            return new TransitionMatrix(counts);
        } catch (Exception e) {
            log.warn("Failed to deserialize transition matrix, resetting to empty: {}", e.getMessage());
            return TransitionMatrix.empty();
        }
    }
}