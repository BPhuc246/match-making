import type { MatchResult } from "./globalInterface";

export interface MatchHistory {
  id: string;
  opponentId: string;
  opponentName: string;
  mode: "casual" | "rank";
  playerScore: number;
  opponentScore: number;
  result: MatchResult;
  scoreChange: number;
  date: string;
}

export interface MatchmakingState {
  isQueuing: boolean;
  queueMode: "casual" | "rank" | null;
  queueStartTime: number | null;
  matchedRoomId: string | null;
}