package com.bphuc246.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.bphuc246.Repository.MatchRepository;
import com.bphuc246.dto.Response.CalibrationBucketResponse;
import com.bphuc246.dto.Response.CalibrationSummaryResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminService {

    MatchRepository matchRepository;

    public CalibrationSummaryResponse getCalibrationSummary() {
        List<CalibrationBucketResponse> buckets = matchRepository.getCalibrationBuckets();
        long total = matchRepository.countRankedFinishedMatches();

        double mae = buckets.isEmpty() ? 0.0 : buckets.stream()
                .mapToDouble(b -> Math.abs(b.actualWinRate() - b.avgPredictedWinProb()))
                .average()
                .orElse(0.0);

        return new CalibrationSummaryResponse(total, mae, buckets);
    }
}