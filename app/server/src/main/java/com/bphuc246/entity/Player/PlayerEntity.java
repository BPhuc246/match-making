package com.bphuc246.entity.Player;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
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
@Table(name = "players")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PlayerEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "username", nullable = false, unique = true, length = 20)
    String username;

    @Column(name = "email", nullable = false, unique = true, length = 100)
    String email;

    @Column(nullable = false)
    String password;

    @Builder.Default
    String avatar = "";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    AccountStatus accountStatus = AccountStatus.ACTIVE;

    @Column(name = "last_login")
    LocalDateTime lastLogin;

    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt;

    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    @Column(nullable = false)
    @Builder.Default
    Double rating = 1500.0;

    @Column(name = "rating_deviation", nullable = false)
    @Builder.Default
    Double ratingDeviation = 350.0; // confidence in the rating; high = uncertain (new/inactive player)

    @Column(nullable = false)
    @Builder.Default
    Double volatility = 0.06; // how erratic the player's results are, standard Glicko-2 default

    @Column(name = "games_played", nullable = false)
    @Builder.Default
    Integer gamesPlayed = 0;

    @Column(nullable = false)
    @Builder.Default
    Integer wins = 0;

    @Column(nullable = false)
    @Builder.Default
    Integer losses = 0;

    @Column(nullable = false)
    @Builder.Default
    Integer draws = 0;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        lastLogin = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        lastLogin = LocalDateTime.now();
    }
}
