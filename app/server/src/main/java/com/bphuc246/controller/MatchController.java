package com.bphuc246.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.bphuc246.dto.ApiResponse;
import com.bphuc246.dto.Response.QueueJoinResponse;
import com.bphuc246.entity.QueueEntry.QueueType;
import com.bphuc246.service.MatchService;
import com.bphuc246.service.PlayerService;
import com.bphuc246.service.QueueEntryService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/match")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MatchController {

    MatchService matchService;
    PlayerService playerService;
    QueueEntryService queueEntryService;

    // QueueEntryController
    @GetMapping("/status")
    public ApiResponse<QueueJoinResponse> status(@RequestParam QueueType queueType, Authentication authentication) {
        Long playerId = resolvePlayerId(authentication);
        QueueJoinResponse response = queueEntryService.getStatus(playerId, queueType);
        return ApiResponse.<QueueJoinResponse>builder().result(response).build();
    }

    @DeleteMapping("/{matchId}/leave")
    public ApiResponse<Void> leaveRoom(@PathVariable Long matchId, Authentication authentication) {
        Long playerId = resolvePlayerId(authentication);
        matchService.leaveRoom(matchId, playerId);
        return ApiResponse.<Void>builder().build();
    }

    private Long resolvePlayerId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String email = authentication.getName();
        return playerService.getUsers(email).getId();
    }
}
