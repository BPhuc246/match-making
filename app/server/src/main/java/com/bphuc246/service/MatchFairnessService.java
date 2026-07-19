package com.bphuc246.service;

import org.springframework.stereotype.Service;

import com.bphuc246.entity.Player.PlayerEntity;
import com.bphuc246.util.Glicko2Calculator;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MatchFairnessService {

    // How much predictability mismatch matters relative to rating-based win
    // probability skew. Both terms are normalized to [0, 1] "unfairness"
    // before combining, so this is a straightforward weighted average —
    // tune this once you have real match outcome data to check against.
    static final double PREDICTABILITY_WEIGHT = 0.3;
    static final double WIN_PROB_WEIGHT = 0.7;

    PlayerMoveStatsService playerMoveStatsService;

    /**
     * Lower is better. 0.0 = perfectly fair matchup, higher = increasingly lopsided.
     * Combines:
     *  - how far the Glicko-2 predicted win probability sits from 50/50
     *  - how large the gap is between both players' predictability scores
     *    (a wide gap means one player is much easier to read than the other,
     *    independent of rating)
     */
    public double computeUnfairness(PlayerEntity a, PlayerEntity b) {
        double winProb = Glicko2Calculator.winProbability(
                a.getRating(), a.getRatingDeviation(), b.getRating(), b.getRatingDeviation());
        double winProbSkew = Math.abs(winProb - 0.5) * 2; // rescale [0.5,1.0] deviation to [0,1]

        Double predA = playerMoveStatsService.getPredictabilityScore(a.getId());
        Double predB = playerMoveStatsService.getPredictabilityScore(b.getId());

        // If either player doesn't have enough data yet, we can't factor in
        // predictability at all — treat it as neutral (0 contribution) rather
        // than guessing, since a wrong guess here is worse than no signal.
        double predictabilityGap = (predA != null && predB != null)
                ? Math.abs(predA - predB)
                : 0.0;

        return (WIN_PROB_WEIGHT * winProbSkew) + (PREDICTABILITY_WEIGHT * predictabilityGap);
    }
}