package com.bphuc246.entity.Round;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "round", uniqueConstraints = @UniqueConstraint(columnNames = {"match_id", "round_number"}))
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RoundEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "match_id", nullable = false)
    Long matchId;

    @Column(name = "round_number", nullable = false)
    Integer roundNumber;

    @Enumerated(EnumType.STRING)
    GameChoice playerOneChoice;

    @Enumerated(EnumType.STRING)
    GameChoice playerTwoChoice;

    Long winnerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    RoundStatus status = RoundStatus.PENDING;
}
