package com.bphuc246.controller;

import java.text.ParseException;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.bphuc246.dto.ApiResponse;
import com.bphuc246.dto.Request.AuthRequest.LoginRequest;
import com.bphuc246.dto.Request.AuthRequest.LogoutRequest;
import com.bphuc246.dto.Request.AuthRequest.RegisterRequest;
import com.bphuc246.dto.Response.AuthResponse.AuthResponse;
import com.bphuc246.dto.Response.PlayerResponse.PlayerResponse;
import com.bphuc246.service.AuthService;
import com.bphuc246.service.PlayerService;
import com.nimbusds.jose.JOSEException;

import lombok.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import org.springframework.web.bind.annotation.GetMapping;


@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthController {

    AuthService authService;
    PlayerService playerService;

    @NonFinal
    @Value("${jwt.cookieRefresh}")
    protected int COOKIE_REFRESH;
    
    @NonFinal
    @Value("${jwt.cookieAccess}")
    protected int COOKIE_ACCESS;

    private void setAuthCookies(HttpServletResponse response, AuthResponse result) {
        Cookie refreshCookie = new Cookie("refresh_token", result.getRefreshToken());
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(false);  // ← false for local, true for production
        refreshCookie.setPath("/");  
        refreshCookie.setMaxAge(COOKIE_REFRESH);
        response.addCookie(refreshCookie);

        Cookie accessCookie = new Cookie("access_token", result.getAccessToken());
        accessCookie.setHttpOnly(true);
        accessCookie.setSecure(false);   
        accessCookie.setPath("/");
        accessCookie.setMaxAge(COOKIE_ACCESS);
        response.addCookie(accessCookie);
    }

    @GetMapping("/me")
    ApiResponse<PlayerResponse> fetchUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String email = authentication.getName();
        var result = this.playerService.getUsers(email);
        return ApiResponse.<PlayerResponse>builder().result(result).build();
    }

    @PostMapping("/register")
    ApiResponse<AuthResponse> register(@RequestBody RegisterRequest data, HttpServletResponse response) {
        var result = this.authService.register(data);
        setAuthCookies(response, result);
        return ApiResponse.<AuthResponse>builder().result(result).build();
    }

    @PostMapping("/login") // Uncategorized error
    ApiResponse<AuthResponse> login(@RequestBody LoginRequest data, HttpServletResponse response) {
        var result = this.authService.login(data);
        setAuthCookies(response, result);
        return ApiResponse.<AuthResponse>builder().result(result).build();
    }

    @PostMapping("/logout")
    public ApiResponse<AuthResponse> logout(HttpServletRequest request, HttpServletResponse response) throws ParseException, JOSEException {
        String accessToken = null;
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (cookie.getName().equals("access_token")) {
                    accessToken = cookie.getValue();
                    break;
                }
            }
        }

        if (accessToken != null) {
            this.authService.logout(new LogoutRequest(accessToken));
        }

        Cookie refreshCookie = new Cookie("refresh_token", null);
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(false);
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(0);
        response.addCookie(refreshCookie);

        Cookie accessCookie = new Cookie("access_token", null);
        accessCookie.setHttpOnly(true);
        accessCookie.setSecure(false);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(0);  
        response.addCookie(accessCookie);

        return ApiResponse.<AuthResponse>builder().result(AuthResponse.builder().authenticated(false).build()).build();
    }

    @PostMapping("/refresh")
    ApiResponse<AuthResponse> refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = null;
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (cookie.getName().equals("refresh_token")) {
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }

        if (refreshToken == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }

        var result = this.authService.refreshToken(refreshToken);
        setAuthCookies(response, result);

        return ApiResponse.<AuthResponse>builder().result(result).build();
    }
}