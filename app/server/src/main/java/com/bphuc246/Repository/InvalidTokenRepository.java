package com.bphuc246.Repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bphuc246.entity.InvalidToken;

public interface InvalidTokenRepository extends JpaRepository<InvalidToken, String> {

}