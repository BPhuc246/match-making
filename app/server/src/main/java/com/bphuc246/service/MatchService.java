package com.bphuc246.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bphuc246.Repository.MatchRepository;
import com.bphuc246.Repository.QueueEntryRepository;
import com.bphuc246.entity.Match.MatchEntity;
import com.bphuc246.entity.Match.MatchStatus;
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
public class MatchService {

    MatchRepository matchRepository;
    QueueEntryRepository queueEntryRepository;

    public Long getOpponentId(Long matchId, Long playerId) {
        MatchEntity match = matchRepository.findById(matchId)
                .orElseThrow(() -> new AppException(ErrorCode.MATCH_NOT_FOUND));

        if (match.getPlayerOneId().equals(playerId)) {
            return match.getPlayerTwoId();
        }
        if (match.getPlayerTwoId().equals(playerId)) {
            return match.getPlayerOneId();
        }

        throw new AppException(ErrorCode.NOT_MATCH_PARTICIPANT);
    }

    @Transactional
    public MatchEntity createMatch(Long playerOneId, Long playerTwoId) {
        MatchEntity match = MatchEntity.builder()
                .playerOneId(playerOneId)
                .playerTwoId(playerTwoId)
                .status(MatchStatus.WAITING_FOR_PLAYERS)
                .build();
        match = matchRepository.save(match);
        log.info("Match {} created for players {} vs {}", match.getId(), playerOneId, playerTwoId);
        return match;
    }

    /**
     * Called when a player actually enters the room (not just matched).
     * Flip WAITING_FOR_PLAYERS -> IN_PROGRESS once both players have joined.
     * (Simplified: caller decides when "both" have joined; see MatchController.)
     */
    @Transactional
    public void startMatch(Long matchId) {
        MatchEntity match = getActiveMatch(matchId);
        match.setStatus(MatchStatus.IN_PROGRESS);
        match.setStartedAt(java.time.LocalDateTime.now());
        matchRepository.save(match);
    }

    @Transactional
    public void endMatch(Long matchId, Long winnerId) {
        MatchEntity match = getActiveMatch(matchId);
        match.setStatus(MatchStatus.FINISHED);
        match.setWinnerId(winnerId);
        match.setEndedAt(java.time.LocalDateTime.now());
        matchRepository.save(match);
    }

    /**
     * A player leaving before/without finishing cancels the match.
     * Adjust this policy to your game's rules (e.g. forfeit -> opponent wins instead).
     */
    @Transactional
    public void cancelMatch(Long matchId) {
        MatchEntity match = getActiveMatch(matchId);
        match.setStatus(MatchStatus.CANCELLED);
        match.setEndedAt(java.time.LocalDateTime.now());
        matchRepository.save(match);
    }

    private MatchEntity getActiveMatch(Long matchId) {
        return matchRepository.findById(matchId)
                .orElseThrow(() -> new AppException(ErrorCode.MATCH_NOT_FOUND));
    }

    @Transactional
    public void leaveRoom(Long matchId, Long playerId) {
        MatchEntity match = matchRepository.findById(matchId)
                .orElseThrow(() -> new AppException(ErrorCode.MATCH_NOT_FOUND));

        // Only allow the two actual participants to leave this room
        if (!match.getPlayerOneId().equals(playerId) && !match.getPlayerTwoId().equals(playerId)) {
            throw new AppException(ErrorCode.NOT_MATCH_PARTICIPANT);
        }

        // Delete only this player's queue record — the opponent's stays until they leave too
        queueEntryRepository.deleteByPlayerIdAndMatchId(playerId, matchId);

        // If someone leaves while the match hasn't finished, treat it as a forfeit/cancel
        if (match.getStatus() == MatchStatus.WAITING_FOR_PLAYERS || match.getStatus() == MatchStatus.IN_PROGRESS) {
            match.setStatus(MatchStatus.CANCELLED);
            match.setEndedAt(java.time.LocalDateTime.now());
            matchRepository.save(match);
        }

        log.info("Player {} left match {}", playerId, matchId);
    }
}

