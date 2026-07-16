package com.bphuc246.dto.Response;

import com.bphuc246.entity.Round.GameChoice;
import com.bphuc246.entity.Round.RoundStatus;

public record RoundResponse(
        Integer roundNumber,
        GameChoice myChoice,       // always visible
        GameChoice opponentChoice, // null until round COMPLETED
        Long winnerId,             // -1 = draw, null = pending
        RoundStatus status
) {}