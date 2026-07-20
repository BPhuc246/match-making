export interface CalibrationBucket {
  bucket: number;
  matchCount: number;
  actualWinRate: number;
  avgPredictedWinProb: number;
  avgUnfairness: number;
}

export interface CalibrationSummary {
  totalRankedMatches: number;
  meanAbsoluteCalibrationError: number;
  buckets: CalibrationBucket[];
}

export interface AdminSliceState {
  calibration: CalibrationSummary | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}