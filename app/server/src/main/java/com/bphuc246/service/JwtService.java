package com.bphuc246.service;

import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.SignedJWT;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class JwtService {

    @Value("${jwt.accessKey}")
    private String SECRET_ACCESS_KEY;

    public boolean isAccessTokenValid(String token) {
        try {
            getSignedJWT(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String extractUsername(String token) {
        return getClaim(token, "sub");
    }

    public String extractJwtId(String token) {
        return getClaim(token, "jti");
    }

    public String extractEmail(String token) {
        return getClaim(token, "email"); 
    }

    public List<String> extractAuthorities(String token) {
        try {
            SignedJWT jwt = getSignedJWT(token);
            List<String> roles = jwt.getJWTClaimsSet().getStringListClaim("roles");
            return roles != null ? roles : List.of();
        } catch (Exception e) {
            throw new RuntimeException("Failed to extract authorities", e);
        }
    }

    private SignedJWT getSignedJWT(String token) throws Exception {
        SignedJWT jwt = SignedJWT.parse(token);
        JWSVerifier verifier = new MACVerifier(SECRET_ACCESS_KEY.getBytes());
        if (!jwt.verify(verifier)) throw new RuntimeException("Invalid signature");
        if (new Date().after(jwt.getJWTClaimsSet().getExpirationTime()))  
            throw new RuntimeException("Token expired");
        return jwt;
    }

    private String getClaim(String token, String claim) {
        try {
            return getSignedJWT(token).getJWTClaimsSet().getStringClaim(claim);
        } catch (Exception e) {
            throw new RuntimeException("Failed to extract claim: " + claim, e);
        }
    }
}