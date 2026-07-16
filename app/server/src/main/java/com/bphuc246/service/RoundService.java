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
    static final int WINS_NEEDED = 2; // best of 3

    RoundRepository roundRepository;
    MatchService matchService;
    SimpMessagingTemplate messagingTemplate;

    /** Ensures round 1 exists; called once when a match is created. */
    @Transactional
    public void startFirstRound(Long matchId) {
        roundRepository.save(RoundEntity.builder()
                .matchId(matchId)
                .roundNumber(1)
                .status(RoundStatus.PENDING)
                .build());
    }

    @Transactional
    public MatchStateResponse submitChoice(Long matchId, Long playerId, GameChoice choice) {
        MatchEntity match = matchService.getActiveMatch(matchId);

        if (match.getStatus() != MatchStatus.WAITING_FOR_PLAYERS && match.getStatus() != MatchStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.MATCH_NOT_IN_PROGRESS);
        }
        if (match.getStatus() == MatchStatus.WAITING_FOR_PLAYERS) {
            matchService.markInProgress(match);
        }

        boolean isPlayerOne = match.getPlayerOneId().equals(playerId);
        if (!isPlayerOne && !match.getPlayerTwoId().equals(playerId)) {
            throw new AppException(ErrorCode.NOT_MATCH_PARTICIPANT);
        }

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

        if (round.getPlayerOneChoice() != null && round.getPlayerTwoChoice() != null) {
            resolveRound(match, round);
        }

        MatchStateResponse state = buildAndBroadcastState(matchId);
        return state;
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
            Long matchWinnerId = p1Wins == p2Wins ? -1L : (p1Wins > p2Wins ? match.getPlayerOneId() : match.getPlayerTwoId());
            matchService.finishMatch(match, matchWinnerId);
        } else {
            roundRepository.save(RoundEntity.builder()
                    .matchId(match.getId())
                    .roundNumber(round.getRoundNumber() + 1)
                    .status(RoundStatus.PENDING)
                    .build());
        }
    }

    /** Standard RPS rules. Returns winner playerId, -1L for draw. */
    private Long decideWinner(GameChoice p1, GameChoice p2, Long p1Id, Long p2Id) {
        if (p1 == p2) return -1L;
        boolean p1Wins = switch (p1) {
            case ROCK -> p2 == GameChoice.SCISSORS;
            case PAPER -> p2 == GameChoice.ROCK;
            case SCISSORS -> p2 == GameChoice.PAPER;
        };
        return p1Wins ? p1Id : p2Id;
    }

    @Transactional
    public MatchStateResponse getMatchState(Long matchId, Long requestingPlayerId) {
        MatchEntity match = matchService.getActiveMatch(matchId);
        if (!match.getPlayerOneId().equals(requestingPlayerId) && !match.getPlayerTwoId().equals(requestingPlayerId)) {
            throw new AppException(ErrorCode.NOT_MATCH_PARTICIPANT);
        }
        return buildState(match, requestingPlayerId);
    }

    /** Builds a neutral (server-perspective) state, then broadcasts a per-player-safe payload to each player individually via /topic — see note below. */
    private MatchStateResponse buildAndBroadcastState(Long matchId) {
        MatchEntity match = matchService.getActiveMatch(matchId);
        // Broadcast on a shared topic; each client filters/derives "my" vs "opponent" choice client-side
        // using their own known playerId, since /topic is shared by both players.
        MatchStateResponse sharedView = buildState(match, null);
        messagingTemplate.convertAndSend("/topic/match/" + matchId, sharedView);
        return sharedView;
    }

    private MatchStateResponse buildState(MatchEntity match, Long requestingPlayerId) {
        List<RoundEntity> rounds = roundRepository.findByMatchIdOrderByRoundNumberAsc(match.getId());

        List<RoundResponse> roundResponses = rounds.stream().map(r -> {
            boolean revealAll = r.getStatus() == RoundStatus.COMPLETED || requestingPlayerId == null;
            GameChoice myChoice = requestingPlayerId == null ? null
                    : (match.getPlayerOneId().equals(requestingPlayerId) ? r.getPlayerOneChoice() : r.getPlayerTwoChoice());
            GameChoice oppChoice = requestingPlayerId == null ? null
                    : (revealAll ? (match.getPlayerOneId().equals(requestingPlayerId) ? r.getPlayerTwoChoice() : r.getPlayerOneChoice()) : null);
            return new RoundResponse(r.getRoundNumber(), myChoice, oppChoice, r.getWinnerId(), r.getStatus());
        }).toList();

        long p1Score = rounds.stream().filter(r -> match.getPlayerOneId().equals(r.getWinnerId())).count();
        long p2Score = rounds.stream().filter(r -> match.getPlayerTwoId().equals(r.getWinnerId())).count();
        int currentRoundNumber = rounds.isEmpty() ? 1 : rounds.get(rounds.size() - 1).getRoundNumber();

        return new MatchStateResponse(
                match.getId(), match.getPlayerOneId(), match.getPlayerTwoId(), match.getStatus(),
                match.getWinnerId(), (int) p1Score, (int) p2Score, currentRoundNumber, roundResponses
        );
    }
}