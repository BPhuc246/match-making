package com.bphuc246.dto.Request;

import com.bphuc246.entity.QueueEntry.QueueType;

import jakarta.validation.constraints.NotNull;

public record JoinQueueRequest(
        @NotNull(message = "queueType is required")
        QueueType queueType
) {}
