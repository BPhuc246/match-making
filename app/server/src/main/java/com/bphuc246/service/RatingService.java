package com.bphuc246.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bphuc246.Repository.PlayerRepository;
import com.bphuc246.entity.Player.PlayerEntity;
import com.bphuc246.util.Glicko2Calculator;
import com.bphuc246.util.Glicko2Calculator.Glicko2Rating;
import com.bphuc246.util.Glicko2Calculator.Opponent;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RatingService {

    PlayerRepository playerRepository;

    public record RatingUpdateResult(
            double playerOneBefore, double playerOneAfter,
            double playerTwoBefore, double playerTwoAfter
    ) {}

    @Transactional
    public RatingUpdateResult applyMatchResult(Long playerOneId, Long playerTwoId, Long winnerId) {
        PlayerEntity p1 = playerRepository.findById(playerOneId)
                .orElseThrow(() -> new IllegalStateException("Player not found: " + playerOneId));
        PlayerEntity p2 = playerRepository.findById(playerTwoId)
                .orElseThrow(() -> new IllegalStateException("Player not found: " + playerTwoId));

        double p1Before = p1.getRating();
        double p2Before = p2.getRating();

        double p1Score = winnerId == -1 ? 0.5 : (winnerId.equals(playerOneId) ? 1.0 : 0.0);
        double p2Score = 1.0 - p1Score;

        Glicko2Rating p1Rating = new Glicko2Rating(p1.getRating(), p1.getRatingDeviation(), p1.getVolatility());
        Glicko2Rating p2Rating = new Glicko2Rating(p2.getRating(), p2.getRatingDeviation(), p2.getVolatility());

        Glicko2Rating p1Updated = Glicko2Calculator.update(
                p1Rating, List.of(new Opponent(p2Rating.rating(), p2Rating.rd(), p1Score)));
        Glicko2Rating p2Updated = Glicko2Calculator.update(
                p2Rating, List.of(new Opponent(p1Rating.rating(), p1Rating.rd(), p2Score)));

        p1.setRating(p1Updated.rating());
        p1.setRatingDeviation(p1Updated.rd());
        p1.setVolatility(p1Updated.volatility());
        p1.setGamesPlayed(p1.getGamesPlayed() + 1);

        p2.setRating(p2Updated.rating());
        p2.setRatingDeviation(p2Updated.rd());
        p2.setVolatility(p2Updated.volatility());
        p2.setGamesPlayed(p2.getGamesPlayed() + 1);

        if (winnerId == -1) {
            p1.setDraws(p1.getDraws() + 1);
            p2.setDraws(p2.getDraws() + 1);
        } else if (winnerId.equals(playerOneId)) {
            p1.setWins(p1.getWins() + 1);
            p2.setLosses(p2.getLosses() + 1);
        } else {
            p2.setWins(p2.getWins() + 1);
            p1.setLosses(p1.getLosses() + 1);
        }

        playerRepository.save(p1);
        playerRepository.save(p2);

        log.info("Rating update: p{} {} -> {}, p{} {} -> {}",
                playerOneId, p1Before, p1Updated.rating(), playerTwoId, p2Before, p2Updated.rating());

        return new RatingUpdateResult(p1Before, p1Updated.rating(), p2Before, p2Updated.rating());
    }
}