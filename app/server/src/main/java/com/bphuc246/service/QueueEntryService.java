package com.bphuc246.service;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bphuc246.Repository.QueueEntryRepository;
import com.bphuc246.dto.Response.QueueJoinResponse;
import com.bphuc246.entity.Match.MatchEntity;
import com.bphuc246.entity.QueueEntry.QueueEntryEntity;
import com.bphuc246.entity.QueueEntry.QueueStatus;
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
public class QueueEntryService {

    QueueEntryRepository queueEntryRepository;
    MatchService matchService;
    MatchNotificationService matchNotificationService;
    RoundService roundService;

    // QueueEntryService
    @Transactional
    public QueueJoinResponse getStatus(Long playerId, QueueType queueType) {
        QueueEntryEntity entry = queueEntryRepository
                .findTopByPlayerIdAndQueueTypeOrderByJoinedAtDesc(playerId, queueType)
                .orElseThrow(() -> new AppException(ErrorCode.QUEUE_ENTRY_NOT_FOUND));

        if (entry.getQueueStatus() == QueueStatus.WAITING) {
            return QueueJoinResponse.waiting(entry.getId());
        }
        if (entry.getQueueStatus() == QueueStatus.FINISHED && entry.getMatchId() != null) {
            Long opponentId = matchService.getOpponentId(entry.getMatchId(), playerId);
            return QueueJoinResponse.matched(entry.getId(), opponentId, entry.getMatchId());
        }
        return QueueJoinResponse.waiting(entry.getId()); // cancelled or edge case, adjust as needed
    }

    @Transactional
    public QueueJoinResponse joinQueue(Long playerId, QueueType queueType) {

        queueEntryRepository
                .findByPlayerIdAndQueueTypeAndQueueStatus(playerId, queueType, QueueStatus.WAITING)
                .ifPresent(e -> { throw new AppException(ErrorCode.ALREADY_IN_QUEUE); });

        QueueEntryEntity self = QueueEntryEntity.builder()
                .playerId(playerId).queueType(queueType).queueStatus(QueueStatus.WAITING).build();
        self = queueEntryRepository.save(self);
        queueEntryRepository.flush();

        List<QueueEntryEntity> opponents = queueEntryRepository.findWaitingOpponents(
                queueType, QueueStatus.WAITING, playerId, PageRequest.of(0, 1));

        if (opponents.isEmpty()) {
            return QueueJoinResponse.waiting(self.getId());
        }

        QueueEntryEntity opponent = opponents.get(0);

        // Two explicit calls instead of MatchService reaching into RoundService internally
        MatchEntity match = matchService.createMatch(opponent.getPlayerId(), playerId);
        roundService.startFirstRound(match.getId());

        self.setQueueStatus(QueueStatus.FINISHED);
        self.setMatchId(match.getId());
        opponent.setQueueStatus(QueueStatus.FINISHED);
        opponent.setMatchId(match.getId());
        queueEntryRepository.save(self);
        queueEntryRepository.save(opponent);

        matchNotificationService.notifyMatched(playerId, self.getId(), opponent.getPlayerId(), match.getId());
        matchNotificationService.notifyMatched(opponent.getPlayerId(), opponent.getId(), playerId, match.getId());

        return QueueJoinResponse.matched(self.getId(), opponent.getPlayerId(), match.getId());
    }
    @Transactional
    public void cancelQueue(Long playerId, QueueType queueType) {
        QueueEntryEntity entry = queueEntryRepository
                .findByPlayerIdAndQueueTypeAndQueueStatus(playerId, queueType, QueueStatus.WAITING)
                .orElseThrow(() -> new AppException(ErrorCode.QUEUE_ENTRY_NOT_FOUND));

        entry.setQueueStatus(QueueStatus.CANCELLED);
        queueEntryRepository.save(entry);
    }
}