package com.bphuc246.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bphuc246.Repository.MatchRepository;
import com.bphuc246.Repository.QueueEntryRepository;
import com.bphuc246.entity.Match.MatchEntity;
import com.bphuc246.entity.Match.MatchStatus;
import com.bphuc246.entity.QueueEntry.QueueType;
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
    RatingService ratingService;

    public Long getOpponentId(Long matchId, Long playerId) {
        MatchEntity match = getActiveMatch(matchId);
        if (match.getPlayerOneId().equals(playerId)) return match.getPlayerTwoId();
        if (match.getPlayerTwoId().equals(playerId)) return match.getPlayerOneId();
        throw new AppException(ErrorCode.NOT_MATCH_PARTICIPANT);
    }

    @Transactional
    public MatchEntity createMatch(Long playerOneId, Long playerTwoId, QueueType queueType) {
        MatchEntity match = MatchEntity.builder()
                .playerOneId(playerOneId)
                .playerTwoId(playerTwoId)
                .status(MatchStatus.WAITING_FOR_PLAYERS)
                .queueType(queueType)
                .build();
        match = matchRepository.save(match);
        log.info("Match {} created for players {} vs {} (queueType={})", match.getId(), playerOneId, playerTwoId, queueType);
        return match;
    }

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

    @Transactional
    public void cancelMatch(Long matchId) {
        MatchEntity match = getActiveMatch(matchId);
        match.setStatus(MatchStatus.CANCELLED);
        match.setEndedAt(java.time.LocalDateTime.now());
        matchRepository.save(match);
    }

    MatchEntity getActiveMatch(Long matchId) {
        return matchRepository.findById(matchId)
                .orElseThrow(() -> new AppException(ErrorCode.MATCH_NOT_FOUND));
    }

    @Transactional
    public void markInProgress(MatchEntity match) {
        match.setStatus(MatchStatus.IN_PROGRESS);
        match.setStartedAt(java.time.LocalDateTime.now());
        matchRepository.save(match);
    }

    @Transactional
    public void finishMatch(MatchEntity match, Long winnerId) {
        match.setStatus(MatchStatus.FINISHED);
        match.setWinnerId(winnerId);
        match.setEndedAt(java.time.LocalDateTime.now());

        // Only RANKED matches affect rating — CASUAL is play-for-fun, shouldn't move anyone's skill number
        if (match.getQueueType() == QueueType.RANKED) {
            RatingService.RatingUpdateResult result =
                    ratingService.applyMatchResult(match.getPlayerOneId(), match.getPlayerTwoId(), winnerId);

            match.setPlayerOneRatingBefore(result.playerOneBefore());
            match.setPlayerOneRatingAfter(result.playerOneAfter());
            match.setPlayerTwoRatingBefore(result.playerTwoBefore());
            match.setPlayerTwoRatingAfter(result.playerTwoAfter());
        }

        matchRepository.save(match);
    }

    @Transactional
    public void leaveRoom(Long matchId, Long playerId) {
        MatchEntity match = getActiveMatch(matchId);

        if (!match.getPlayerOneId().equals(playerId) && !match.getPlayerTwoId().equals(playerId)) {
            throw new AppException(ErrorCode.NOT_MATCH_PARTICIPANT);
        }

        queueEntryRepository.deleteByPlayerIdAndMatchId(playerId, matchId);

        if (match.getStatus() == MatchStatus.WAITING_FOR_PLAYERS || match.getStatus() == MatchStatus.IN_PROGRESS) {
            match.setStatus(MatchStatus.CANCELLED);
            match.setEndedAt(java.time.LocalDateTime.now());
            matchRepository.save(match);
        }

        log.info("Player {} left match {}", playerId, matchId);
    }

}

