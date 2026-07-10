package com.bphuc246.config;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.bphuc246.Repository.InvalidTokenRepository;
import com.bphuc246.service.JwtService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;                  
    private final InvalidTokenRepository invalidTokenRepository;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        try {
            String token = extractTokenFromCookie(request);

            if (token != null && jwtService.isAccessTokenValid(token)) {
                String jwtId = jwtService.extractJwtId(token);
                boolean isInvalidated = invalidTokenRepository.existsById(jwtId);

                if (!isInvalidated) {
                    String email = jwtService.extractEmail(token);
                    List<String> roles = jwtService.extractAuthorities(token);

                    List<SimpleGrantedAuthority> authorities = roles.stream()
                            .map(SimpleGrantedAuthority::new)
                            .toList();

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(email, null, authorities);

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (Exception e) {
            SecurityContextHolder.clearContext();
            logger.warn("JWT processing failed: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

        private String extractTokenFromCookie(HttpServletRequest request) {
            if (request.getCookies() == null) {
                logger.warn("No cookies found in request");
                return null;
            }
            return Arrays.stream(request.getCookies())
                    .filter(c -> c.getName().equals("access_token"))
                    .map(Cookie::getValue)
                    .findFirst()
                    .orElse(null);
        }

}
