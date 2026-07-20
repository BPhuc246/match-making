package com.bphuc246.entity.Match;

import java.time.LocalDateTime;

import com.bphuc246.entity.QueueEntry.QueueType;

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

    @Column(name = "player_one_rating_before")
    Double playerOneRatingBefore;

    @Column(name = "player_two_rating_before")
    Double playerTwoRatingBefore;

    @Column(name = "player_one_rating_after")
    Double playerOneRatingAfter;

    @Column(name = "player_two_rating_after")
    Double playerTwoRatingAfter;

    @Enumerated(EnumType.STRING)
    @Column(name = "queue_type", nullable = false)
    QueueType queueType; // RANKED matches only affect rating; CASUAL shouldn't

    @Column(name = "predicted_win_probability")
    Double predictedWinProbability; // Glicko-2's E() for playerOne, snapshotted at match creation

    @Column(name = "predicted_unfairness")
    Double predictedUnfairness; // MatchFairnessService's score for the pair, at creation time
}
