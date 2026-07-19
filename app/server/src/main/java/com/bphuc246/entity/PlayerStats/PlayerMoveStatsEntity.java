package com.bphuc246.entity.PlayerStats;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import com.bphuc246.entity.Round.GameChoice;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "player_move_stats")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PlayerMoveStatsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "player_id", nullable = false, unique = true)
    Long playerId;

    // Flattened order-1 Markov transition counts: previousChoice -> nextChoice -> count
    // Stored as JSON rather than 9 separate columns since it's an atomic unit
    // that's always read/written together, and keeps the entity resilient if
    // we ever add a 4th move type or switch to order-2 transitions later.
    @Column(name = "transition_matrix_json", columnDefinition = "TEXT")
    String transitionMatrixJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "last_choice")
    GameChoice lastChoice; // needed to know the "previous move" for the next transition

    @Column(name = "total_moves", nullable = false)
    @Builder.Default
    Integer totalMoves = 0;

    // null until totalMoves crosses the minimum sample threshold — an
    // unset score must be distinguishable from "confirmed perfectly random",
    // otherwise matchmaking would wrongly treat a brand-new player as if
    // they'd been proven unpredictable.
    @Column(name = "predictability_score")
    Double predictabilityScore;

    @Column(name = "last_updated")
    LocalDateTime lastUpdated;
}