package com.bphuc246.dto.Response;

import java.util.List;

import com.bphuc246.entity.Match.MatchStatus;

public record MatchStateResponse(
        Long matchId,
        Long playerOneId,
        Long playerTwoId,
        MatchStatus status,
        Long winnerId,          // -1 = draw, null = not finished
        int playerOneScore,
        int playerTwoScore,
        int currentRoundNumber,
        List<RoundResponse> rounds
) {}