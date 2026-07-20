package com.bphuc246.dto.Response;

public record CalibrationBucketResponse(
        Integer bucket,              // 0-9, representing predicted win prob ranges [0.0-0.1), [0.1-0.2)... [0.9-1.0]
        Long matchCount,
        Double actualWinRate,        // observed: how often playerOne actually won, within this bucket
        Double avgPredictedWinProb,  // observed: average of what was predicted, within this bucket
        Double avgUnfairness
) {}