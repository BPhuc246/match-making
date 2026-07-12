package com.bphuc246.dto.Response;

public record QueueJoinResponse(
        String status,        // "WAITING" or "MATCHED"
        Long queueEntryId,
        Long opponentPlayerId // null if still waiting
) {
    public static QueueJoinResponse waiting(Long queueEntryId) {
        return new QueueJoinResponse("WAITING", queueEntryId, null);
    }

    public static QueueJoinResponse matched(Long queueEntryId, Long opponentPlayerId) {
        return new QueueJoinResponse("MATCHED", queueEntryId, opponentPlayerId);
    }
}
