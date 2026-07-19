package com.bphuc246.entity.QueueEntry;

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
@Table(name = "queue_entry")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QueueEntryEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    Long playerId;
    
    @Column(name = "joined_at", nullable = false)
    LocalDateTime joinedAt;

    @Column(name = "match_id")
    Long matchId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    QueueType queueType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    QueueStatus queueStatus = QueueStatus.WAITING;

    @Column(name = "rating_at_queue")
    Double ratingAtQueue; // snapshot when they joined — used for the search-range calc

    @Column(name = "search_range")
    @Builder.Default
    Integer searchRange = 100; // starts narrow, widens the longer they wait

    @Column(name = "last_widened_at")
    LocalDateTime lastWidenedAt;

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        joinedAt = LocalDateTime.now();
    }
}
