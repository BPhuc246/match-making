package com.bphuc246.matchmaking.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.bphuc246.entity.Player.PlayerEntity;
import com.bphuc246.service.MatchFairnessService;
import com.bphuc246.service.PlayerMoveStatsService;

@ExtendWith(MockitoExtension.class)
class MatchFairnessServiceTest {

    @Mock
    PlayerMoveStatsService playerMoveStatsService;
    @InjectMocks
    MatchFairnessService fairnessService;

    @Test
    void equalRatingsAndEqualPredictability_shouldBeVeryFair() {
        PlayerEntity a = playerWith(1L, 1500, 100);
        PlayerEntity b = playerWith(2L, 1500, 100);
        when(playerMoveStatsService.getPredictabilityScore(1L)).thenReturn(0.4);
        when(playerMoveStatsService.getPredictabilityScore(2L)).thenReturn(0.4);

        double unfairness = fairnessService.computeUnfairness(a, b);
        assertTrue(unfairness < 0.05, "Identical rating + predictability should be near-perfectly fair, got " + unfairness);
    }

    @Test
    void largeRatingGap_shouldBeUnfair() {
        PlayerEntity a = playerWith(1L, 2000, 100);
        PlayerEntity b = playerWith(2L, 1200, 100);
        when(playerMoveStatsService.getPredictabilityScore(1L)).thenReturn(null);
        when(playerMoveStatsService.getPredictabilityScore(2L)).thenReturn(null);

        double unfairness = fairnessService.computeUnfairness(a, b);
        assertTrue(unfairness > 0.5, "800-point rating gap should score clearly unfair, got " + unfairness);
    }

    @Test
    void equalRatingButPredictabilityMismatch_shouldStillPenalize() {
        PlayerEntity a = playerWith(1L, 1500, 100);
        PlayerEntity b = playerWith(2L, 1500, 100);
        when(playerMoveStatsService.getPredictabilityScore(1L)).thenReturn(0.9);
        when(playerMoveStatsService.getPredictabilityScore(2L)).thenReturn(0.1);

        double unfairness = fairnessService.computeUnfairness(a, b);
        assertTrue(unfairness > 0.15, "Large predictability gap at equal rating should raise unfairness clearly above zero, got " + unfairness);
    }

    @Test
    void nullPredictabilityOnOneSide_shouldFallBackToRatingOnly() {
        PlayerEntity a = playerWith(1L, 1500, 100);
        PlayerEntity b = playerWith(2L, 1500, 100);
        when(playerMoveStatsService.getPredictabilityScore(1L)).thenReturn(null);
        when(playerMoveStatsService.getPredictabilityScore(2L)).thenReturn(0.8);

        double unfairness = fairnessService.computeUnfairness(a, b);
        assertEquals(0.0, unfairness, 0.01, "Missing data on either side should fall back to rating-only scoring, not error or guess");
    }

    @Test
    void nullPredictabilityOnBothSides_shouldStillWork() {
        PlayerEntity a = playerWith(1L, 1500, 100);
        PlayerEntity b = playerWith(2L, 1500, 100);
        when(playerMoveStatsService.getPredictabilityScore(1L)).thenReturn(null);
        when(playerMoveStatsService.getPredictabilityScore(2L)).thenReturn(null);

        double unfairness = fairnessService.computeUnfairness(a, b);
        assertEquals(0.0, unfairness, 0.01, "Both null should behave identically to one null — pure rating-only fallback");
    }

    @Test
    void unfairnessShouldBeSymmetric() {
        // computeUnfairness(a, b) and computeUnfairness(b, a) should give the
        // same result — fairness is a property of the PAIR, not directional.
        PlayerEntity a = playerWith(1L, 1700, 100);
        PlayerEntity b = playerWith(2L, 1400, 100);
        when(playerMoveStatsService.getPredictabilityScore(anyLong())).thenReturn(0.5);

        double ab = fairnessService.computeUnfairness(a, b);
        double ba = fairnessService.computeUnfairness(b, a);

        assertEquals(ab, ba, 0.01, "Unfairness should be symmetric regardless of argument order, got ab=" + ab + " ba=" + ba);
    }

    private PlayerEntity playerWith(Long id, double rating, double rd) {
        PlayerEntity p = new PlayerEntity();
        p.setId(id);
        p.setRating(rating);
        p.setRatingDeviation(rd);
        return p;
    }
}
