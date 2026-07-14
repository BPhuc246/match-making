package com.bphuc246.config;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

@Component
public class WebSocketHandshakeHandler extends DefaultHandshakeHandler {

    @Override
    protected Principal determineUser(org.springframework.http.server.ServerHttpRequest request,
                                       WebSocketHandler wsHandler,
                                       Map<String, Object> attributes) {
        String email = (String) attributes.get("email");
        // Principal.getName() must return the email, since convertAndSendToUser matches on this
        return new UsernamePasswordAuthenticationToken(email, null, List.of());
    }
}