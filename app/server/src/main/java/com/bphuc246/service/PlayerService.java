package com.bphuc246.service;

import org.springframework.stereotype.Service;

import com.bphuc246.Repository.PlayerRepository;
import com.bphuc246.dto.Response.PlayerResponse.PlayerResponse;
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
public class PlayerService {
    
    PlayerRepository playerRepository;

    public PlayerResponse getUsers(String email) {
        return this.playerRepository.findByEmail(email)
            .map(user -> PlayerResponse.builder()
                    .id(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .avatar(user.getAvatar())
                    .build())
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    
}
