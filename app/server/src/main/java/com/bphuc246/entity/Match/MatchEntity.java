package com.bphuc246.entity.Match;

import java.time.LocalDateTime;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "match")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MatchEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false)
    Long playerOneId;

    @Column(nullable = false)
    Long playerTwoId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    MatchStatus status = MatchStatus.WAITING_FOR_PLAYERS;

    Long winnerId;

    LocalDateTime startedAt;

    LocalDateTime endedAt;
}
