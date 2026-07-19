package com.bphuc246.matchmaking.util;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.bphuc246.util.Glicko2Calculator;

class Glicko2CalculatorTest {

    @Test
    void equalRatings_shouldGive50PercentWinProbability() {
        double prob = Glicko2Calculator.winProbability(1500, 100, 1500, 100);
        assertEquals(0.5, prob, 0.001);
    }

    @Test
    void higherRating_shouldGiveMoreThan50PercentWinProbability() {
        double prob = Glicko2Calculator.winProbability(1700, 100, 1500, 100);
        assertTrue(prob > 0.5, "Higher-rated player should have >50% win probability, got " + prob);
    }

    @Test
    void muchHigherRating_shouldGiveStrongFavorite() {
        double prob = Glicko2Calculator.winProbability(2000, 50, 1200, 50);
        assertTrue(prob > 0.9, "800-point gap at low RD should heavily favor the higher-rated player, got " + prob);
    }

    @Test
    void winProbabilities_shouldBeApproximatelyComplementary() {
        double aWinsVsB = Glicko2Calculator.winProbability(1600, 100, 1500, 100);
        double bWinsVsA = Glicko2Calculator.winProbability(1500, 100, 1600, 100);
        assertEquals(1.0, aWinsVsB + bWinsVsA, 0.05);
    }

    @Test
    void ratingUpdate_winnerShouldGainRating() {
        var winner = new Glicko2Calculator.Glicko2Rating(1500, 200, 0.06);
        var result = Glicko2Calculator.update(
                winner, List.of(new Glicko2Calculator.Opponent(1500, 200, 1.0)));
        assertTrue(result.rating() > 1500, "Winner's rating should increase, got " + result.rating());
    }

    @Test
    void ratingUpdate_loserShouldLoseRating() {
        var loser = new Glicko2Calculator.Glicko2Rating(1500, 200, 0.06);
        var result = Glicko2Calculator.update(
                loser, List.of(new Glicko2Calculator.Opponent(1500, 200, 0.0)));
        assertTrue(result.rating() < 1500, "Loser's rating should decrease, got " + result.rating());
    }

    @Test
    void ratingUpdate_drawShouldBarelyMoveRatingAtEqualStrength() {
        var player = new Glicko2Calculator.Glicko2Rating(1500, 100, 0.06);
        var result = Glicko2Calculator.update(
                player, List.of(new Glicko2Calculator.Opponent(1500, 100, 0.5)));
        assertEquals(1500, result.rating(), 5.0, "A draw between equally-rated players should leave rating nearly unchanged, got " + result.rating());
    }

    @Test
    void ratingDeviation_shouldShrinkAfterAGame() {
        var player = new Glicko2Calculator.Glicko2Rating(1500, 350, 0.06);
        var result = Glicko2Calculator.update(
                player, List.of(new Glicko2Calculator.Opponent(1500, 100, 1.0)));
        assertTrue(result.rd() < 350, "RD should shrink after a game, got " + result.rd());
    }

    @Test
    void upset_lowerRatedWinner_shouldGainMoreThanExpectedWinner() {
        // A low-rated player beating a high-rated one should gain MORE rating
        // than a high-rated player beating a low-rated one would gain —
        // this is the core "surprising result moves rating more" property.
        var underdog = new Glicko2Calculator.Glicko2Rating(1400, 100, 0.06);
        var favoriteAsLoser = new Glicko2Calculator.Glicko2Rating(1400, 100, 0.06);

        var underdogResult = Glicko2Calculator.update(
                underdog, List.of(new Glicko2Calculator.Opponent(1800, 100, 1.0))); // underdog WINS
        var expectedWinResult = Glicko2Calculator.update(
                favoriteAsLoser, List.of(new Glicko2Calculator.Opponent(1000, 100, 1.0))); // easy expected win

        double underdogGain = underdogResult.rating() - 1400;
        double expectedGain = expectedWinResult.rating() - 1400;

        assertTrue(underdogGain > expectedGain,
                "Upset win should gain more rating than an expected win. Upset gain=" + underdogGain + " expected gain=" + expectedGain);
    }
}