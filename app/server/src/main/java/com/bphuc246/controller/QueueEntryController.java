package com.bphuc246.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.bphuc246.dto.ApiResponse;
import com.bphuc246.dto.Request.JoinQueueRequest;
import com.bphuc246.dto.Response.QueueJoinResponse;
import com.bphuc246.entity.QueueEntry.QueueType;
import com.bphuc246.service.PlayerService;
import com.bphuc246.service.QueueEntryService;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/queue_entry")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class QueueEntryController {

    QueueEntryService queueEntryService;
    PlayerService playerService;

    @PostMapping("/match")
    public ApiResponse<QueueJoinResponse> match(@Valid @RequestBody JoinQueueRequest request, Authentication authentication) {
        Long playerId = resolvePlayerId(authentication);
        QueueJoinResponse response = queueEntryService.joinQueue(playerId, request.queueType());
        return ApiResponse.<QueueJoinResponse>builder().result(response).build();
    }

    @DeleteMapping("/match")
    public ApiResponse<Void> cancel(@RequestParam QueueType queueType, Authentication authentication) {
        Long playerId = resolvePlayerId(authentication);
        queueEntryService.cancelQueue(playerId, queueType);
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