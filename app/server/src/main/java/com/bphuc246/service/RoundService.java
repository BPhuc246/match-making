package com.bphuc246.service;

import java.util.List;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bphuc246.Repository.RoundRepository;
import com.bphuc246.dto.Response.MatchStateResponse;
import com.bphuc246.dto.Response.RoundResponse;
import com.bphuc246.entity.Match.MatchEntity;
import com.bphuc246.entity.Match.MatchStatus;
import com.bphuc246.entity.Round.GameChoice;
import com.bphuc246.entity.Round.RoundEntity;
import com.bphuc246.entity.Round.RoundStatus;
import com.bphuc246.exception.AppException;
import com.bphuc246.exception.ErrorCode;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RoundService {

    static final int MAX_ROUNDS = 3;
    static final int WINS_NEEDED = 2;

    RoundRepository roundRepository;
    MatchService matchService;
    PlayerService playerService; // now used for a REAL email lookup, not a stub
    SimpMessagingTemplate messagingTemplate;
    PlayerMoveStatsService playerMoveStatsService;

    @Transactional
    public void startFirstRound(Long matchId) {
        roundRepository.save(RoundEntity.builder()
                .matchId(matchId).roundNumber(1).status(RoundStatus.PENDING).build());
    }

    @Transactional
    public MatchStateResponse submitChoice(Long matchId, Long playerId, GameChoice choice) {
        MatchEntity match = matchService.getActiveMatch(matchId);

        if (match.getStatus() != MatchStatus.IN_PROGRESS && match.getStatus() != MatchStatus.WAITING_FOR_PLAYERS) {
            throw new AppException(ErrorCode.MATCH_NOT_IN_PROGRESS);
        }
        if (match.getStatus() == MatchStatus.WAITING_FOR_PLAYERS) {
            matchService.markInProgress(match);
        }

        boolean isPlayerOne = match.getPlayerOneId().equals(playerId);
        RoundEntity round = roundRepository.findByMatchIdAndStatus(matchId, RoundStatus.PENDING)
                .orElseThrow(() -> new AppException(ErrorCode.ROUND_NOT_FOUND));

        if (isPlayerOne) {
            if (round.getPlayerOneChoice() != null) throw new AppException(ErrorCode.CHOICE_ALREADY_SUBMITTED);
            round.setPlayerOneChoice(choice);
        } else {
            if (round.getPlayerTwoChoice() != null) throw new AppException(ErrorCode.CHOICE_ALREADY_SUBMITTED);
            round.setPlayerTwoChoice(choice);
        }
        roundRepository.save(round);

        // Record this move for predictability tracking, independent of round
        // resolution — every submitted choice is a data point, whether or not
        // the round has resolved yet.
        playerMoveStatsService.recordMove(playerId, choice);

        if (round.getPlayerOneChoice() != null && round.getPlayerTwoChoice() != null) {
            resolveRound(match, round);
        }

        pushStateToBothPlayers(match);
        return buildState(match, playerId);
    }

    private void resolveRound(MatchEntity match, RoundEntity round) {
        GameChoice p1 = round.getPlayerOneChoice();
        GameChoice p2 = round.getPlayerTwoChoice();

        Long winnerId = decideWinner(p1, p2, match.getPlayerOneId(), match.getPlayerTwoId());
        round.setWinnerId(winnerId);
        round.setStatus(RoundStatus.COMPLETED);
        roundRepository.save(round);

        List<RoundEntity> allRounds = roundRepository.findByMatchIdOrderByRoundNumberAsc(match.getId());
        long p1Wins = allRounds.stream().filter(r -> match.getPlayerOneId().equals(r.getWinnerId())).count();
        long p2Wins = allRounds.stream().filter(r -> match.getPlayerTwoId().equals(r.getWinnerId())).count();

        boolean matchDecided = p1Wins >= WINS_NEEDED || p2Wins >= WINS_NEEDED || allRounds.size() >= MAX_ROUNDS;

        if (matchDecided) {
            Long matchWinnerId = (p1Wins == p2Wins) ? -1L
                    : (p1Wins > p2Wins ? match.getPlayerOneId() : match.getPlayerTwoId());
            matchService.finishMatch(match, matchWinnerId);
        } else {
            roundRepository.save(RoundEntity.builder()
                    .matchId(match.getId())
                    .roundNumber(round.getRoundNumber() + 1)
                    .status(RoundStatus.PENDING)
                    .build());
        }
        // NOTE: no broadcast call here anymore — submitChoice does exactly one
        // push, after this method returns, instead of two (this was previously
        // firing broadcastFullState twice per resolved round — harmless but wasteful).
    }

    private Long decideWinner(GameChoice p1, GameChoice p2, Long p1Id, Long p2Id) {
        if (p1 == p2) return -1L;
        boolean p1Wins = switch (p1) {
            case ROCK -> p2 == GameChoice.SCISSORS;
            case PAPER -> p2 == GameChoice.ROCK;
            case SCISSORS -> p2 == GameChoice.PAPER;
        };
        return p1Wins ? p1Id : p2Id;
    }

    @Transactional(readOnly = true)
    public MatchStateResponse getMatchState(Long matchId, Long requestingPlayerId) {
        MatchEntity match = matchService.getActiveMatch(matchId);
        return buildState(match, requestingPlayerId);
    }

    /** Sends each player a state built from THEIR OWN perspective — the fix. */
    private void pushStateToBothPlayers(MatchEntity match) {
        String p1Email = playerService.getEmailById(match.getPlayerOneId());
        String p2Email = playerService.getEmailById(match.getPlayerTwoId());

        messagingTemplate.convertAndSendToUser(p1Email, "/queue/round", buildState(match, match.getPlayerOneId()));
        messagingTemplate.convertAndSendToUser(p2Email, "/queue/round", buildState(match, match.getPlayerTwoId()));
    }

    private MatchStateResponse buildState(MatchEntity match, Long requestingPlayerId) {
        List<RoundEntity> rounds = roundRepository.findByMatchIdOrderByRoundNumberAsc(match.getId());

        List<RoundResponse> roundResponses = rounds.stream().map(r -> {
            boolean isCompleted = r.getStatus() == RoundStatus.COMPLETED;
            GameChoice myChoice = null;
            GameChoice oppChoice = null;

            if (requestingPlayerId != null) {
                boolean isP1 = match.getPlayerOneId().equals(requestingPlayerId);
                myChoice = isP1 ? r.getPlayerOneChoice() : r.getPlayerTwoChoice();
                oppChoice = isCompleted ? (isP1 ? r.getPlayerTwoChoice() : r.getPlayerOneChoice()) : null;
            }

            return new RoundResponse(r.getRoundNumber(), myChoice, oppChoice, r.getWinnerId(), r.getStatus());
        }).toList();

        long p1Score = rounds.stream().filter(r -> match.getPlayerOneId().equals(r.getWinnerId())).count();
        long p2Score = rounds.stream().filter(r -> match.getPlayerTwoId().equals(r.getWinnerId())).count();

        return new MatchStateResponse(
                match.getId(), match.getPlayerOneId(), match.getPlayerTwoId(), match.getStatus(),
                match.getWinnerId(), (int) p1Score, (int) p2Score,
                rounds.isEmpty() ? 1 : rounds.get(rounds.size() - 1).getRoundNumber(), roundResponses
        );
    }
}