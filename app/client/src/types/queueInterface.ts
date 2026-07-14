export type QueueType = "RANKED" | "CASUAL";

export type QueueMode = "casual" | "rank";

export type QueueStatusValue = "WAITING" | "MATCHED";

export interface QueueJoinResponse {
  status: QueueStatusValue;
  queueEntryId: number;
  opponentPlayerId: number | null;
  matchId: number | null;
}

export interface ApiResponse<T> {
  code: number;
  message?: string;
  result: T;
}

export interface QueueState {
  isQueuing: boolean;
  queueMode: QueueMode | null;
  queueType: QueueType | null;
  queueEntryId: number | null;
  matchedRoomId: number | null;
  opponentId: number | null;
  status: "idle" | "loading" | "polling" | "matched" | "failed";
  error: string | null;
}

// Maps frontend mode labels <-> backend enum values
export const QUEUE_MODE_TO_TYPE: Record<QueueMode, QueueType> = {
  casual: "CASUAL",
  rank: "RANKED",
};

export const QUEUE_TYPE_TO_MODE: Record<QueueType, QueueMode> = {
  CASUAL: "casual",
  RANKED: "rank",
};