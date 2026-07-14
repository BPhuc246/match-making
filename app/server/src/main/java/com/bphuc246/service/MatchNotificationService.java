package com.bphuc246.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.bphuc246.Repository.PlayerRepository;
import com.bphuc246.dto.Response.QueueJoinResponse;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MatchNotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final PlayerRepository playerRepository;

    public void notifyMatched(Long playerId, Long queueEntryId, Long opponentId, Long matchId) {
    String email = playerRepository.findById(playerId)
        .map(player -> player.getEmail()).orElseThrow(() -> new EntityNotFoundException("Player not found with ID: " + playerId));
            QueueJoinResponse payload = QueueJoinResponse.matched(queueEntryId, opponentId, matchId);
        messagingTemplate.convertAndSendToUser(email, "/queue/match", payload);
    }
}