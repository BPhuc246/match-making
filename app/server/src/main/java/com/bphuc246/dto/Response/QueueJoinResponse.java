package com.bphuc246.dto.Response;

public record QueueJoinResponse(
        String status,
        Long queueEntryId,
        Long opponentPlayerId,
        Long matchId
) {
    public static QueueJoinResponse waiting(Long queueEntryId) {
        return new QueueJoinResponse("WAITING", queueEntryId, null, null);
    }

    public static QueueJoinResponse matched(Long queueEntryId, Long opponentPlayerId, Long matchId) {
        return new QueueJoinResponse("MATCHED", queueEntryId, opponentPlayerId, matchId);
    }
}