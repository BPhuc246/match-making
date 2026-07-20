package com.bphuc246.dto.Response;

import java.util.List;

public record CalibrationSummaryResponse(
        long totalRankedMatches,
        double meanAbsoluteCalibrationError, // avg |actualWinRate - avgPredictedWinProb| across buckets — lower is better
        List<CalibrationBucketResponse> buckets
) {}