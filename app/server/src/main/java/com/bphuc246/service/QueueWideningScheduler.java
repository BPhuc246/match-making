package com.bphuc246.service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.bphuc246.Repository.QueueEntryRepository;
import com.bphuc246.entity.QueueEntry.QueueEntryEntity;
import com.bphuc246.entity.QueueEntry.QueueStatus;
import com.bphuc246.entity.QueueEntry.QueueType;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class QueueWideningScheduler {

    static final int WIDEN_INTERVAL_SECONDS = 5;
    static final int WIDEN_STEP = 50;
    static final int MAX_SEARCH_RANGE = 1000; // effectively "match anyone" past this point

    QueueEntryRepository queueEntryRepository;

    @Scheduled(fixedRate = WIDEN_INTERVAL_SECONDS * 1000)
    @Transactional
    public void widenWaitingSearches() {
        List<QueueEntryEntity> waiting =
                queueEntryRepository.findByQueueStatusAndQueueType(QueueStatus.WAITING, QueueType.RANKED);

        LocalDateTime now = LocalDateTime.now();
        int widenedCount = 0;

        for (QueueEntryEntity entry : waiting) {
            if (entry.getSearchRange() >= MAX_SEARCH_RANGE) continue;

            LocalDateTime lastWidened = entry.getLastWidenedAt() != null ? entry.getLastWidenedAt() : entry.getJoinedAt();
            long secondsSinceWiden = ChronoUnit.SECONDS.between(lastWidened, now);

            if (secondsSinceWiden >= WIDEN_INTERVAL_SECONDS) {
                entry.setSearchRange(Math.min(entry.getSearchRange() + WIDEN_STEP, MAX_SEARCH_RANGE));
                entry.setLastWidenedAt(now);
                queueEntryRepository.save(entry);
                widenedCount++;
            }
        }

        if (widenedCount > 0) {
            log.debug("Widened search range for {} waiting players", widenedCount);
        }
    }
}