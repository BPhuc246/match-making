export type GameChoice = "ROCK" | "PAPER" | "SCISSORS";
export type RoundStatus = "PENDING" | "COMPLETED";
export type MatchStatus =
  | "WAITING_FOR_PLAYERS"
  | "IN_PROGRESS"
  | "FINISHED"
  | "CANCELLED";

export interface RoundResponse {
  roundNumber: number;
  myChoice: GameChoice | null;       // always visible to the requester
  opponentChoice: GameChoice | null; // null until round is COMPLETED
  winnerId: number | null;           // -1 = draw, null = round still pending
  status: RoundStatus;
}

export interface MatchStateResponse {
  matchId: number;
  playerOneId: number;
  playerTwoId: number;
  status: MatchStatus;
  winnerId: number | null; // -1 = draw, null = match not finished yet
  playerOneScore: number;
  playerTwoScore: number;
  currentRoundNumber: number;
  rounds: RoundResponse[];
}

export interface MatchSliceState {
  currentMatch: MatchStateResponse | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  choiceSubmitting: boolean;
  error: string | null;
}

export type MatchPhase =
  | "preparing"
  | "playing"
  | "round_ended"
  | "finished"
  | "forfeited";