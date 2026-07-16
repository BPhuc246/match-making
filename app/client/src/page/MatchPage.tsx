import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  AlertOctagon,
  RefreshCw,
  FileText,
  Flame,
  LogOut,
  Scissors,
  Trophy,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import type { GameChoice } from "../types/matchInterface";
import type { AppDispatch, RootState } from "../store";
import { fetchMatch, submitChoice, leaveMatch } from "../feature/matchThunk";
import { subscribeToMatch, unsubscribeFromMatch } from "../lib/socket";
import { matchStateUpdated } from "../store/matchSlice";
import { clearMatchedMatchId } from "../store/globalSlice";
import { AnimatePresence } from "motion/react";
import { motion } from "motion/react";

export default function MatchPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { currentMatch, status, choiceSubmitting, error } = useSelector(
    (state: RootState) => state.match,
  );
  const { user } = useSelector((state: RootState) => state.auth);

// ... other imports and component setup remain the same

  const [localChoice, setLocalChoice] = useState<GameChoice | null>(null);
  const [showForfeitModal, setShowForfeitModal] = useState(false);

  // 1. Initial fetch + subscribe
  useEffect(() => {
    if (!matchId) return;

    dispatch(fetchMatch(matchId));
    subscribeToMatch(matchId, (payload) => {
      dispatch(matchStateUpdated(payload));
    });

    return () => unsubscribeFromMatch();
  }, [matchId, dispatch]);

  // 2. Reset local selection when a new round starts (fixed)
  useEffect(() => {
    const latestRound = currentMatch?.rounds[currentMatch.rounds.length - 1];

    // Only reset if we're in a fresh pending round with no choice yet
    if (
      latestRound?.status === "PENDING" &&
      !latestRound.myChoice &&
      localChoice !== null // prevent unnecessary setState
    ) {
      setLocalChoice(null);
    }
  }, [currentMatch, localChoice]); // added localChoice to deps to satisfy exhaustive-deps

  // 3. Clear matched flag
  useEffect(() => {
    dispatch(clearMatchedMatchId());
  }, [dispatch]);

  // 4. Toast on match finish
  useEffect(() => {
    if (currentMatch?.status === "FINISHED" && user) {
      const isP1 = user.id === currentMatch.playerOneId;
      const myScore = isP1 ? currentMatch.playerOneScore : currentMatch.playerTwoScore;
      const oppScore = isP1 ? currentMatch.playerTwoScore : currentMatch.playerOneScore;

      if (currentMatch.winnerId === -1) {
        toast("It's a draw!", { icon: "🤝" });
      } else if (currentMatch.winnerId === user.id) {
        toast.success(`You won! ${myScore} - ${oppScore}`, { icon: "🏆" });
      } else {
        toast.error(`You lost. ${myScore} - ${oppScore}`, { icon: "💔" });
      }
    }
  }, [currentMatch?.status, user]);

  // ... rest of your handlers and JSX stay exactly the same

  const handleSelectChoice = (choice: GameChoice) => {
    if (!matchId || choiceSubmitting) return;
    const latestRound = currentMatch?.rounds[currentMatch.rounds.length - 1];
    if (latestRound?.status !== "PENDING" || latestRound.myChoice) return;

    setLocalChoice(choice);
    dispatch(submitChoice({ matchId, choice }))
      .unwrap()
      .then(() => {
        toast.success(`Locked in: ${choice}!`, { duration: 1500 });
      })
      .catch((err) => {
        toast.error(err || "Failed to lock choice");
        setLocalChoice(null);
      });
  };

  const handleLeaveRoom = () => {
    if (!matchId) return;
    dispatch(leaveMatch(matchId))
      .unwrap()
      .finally(() => {
        setShowForfeitModal(false);
        navigate("/");
      });
  };

  if (status === "loading" && !currentMatch) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="h-8 w-8 text-blue-400 animate-spin" />
        <span className="font-bold text-zinc-300 uppercase tracking-widest text-xs">
          Initializing Arena...
        </span>
      </div>
    );
  }

  if (error || !currentMatch) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertOctagon className="h-10 w-10 text-rose-500 animate-bounce" />
        <h3 className="text-lg font-bold text-white">Lobby Connection Lost</h3>
        <button
          onClick={() => navigate("/")}
          className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold uppercase text-zinc-300 hover:bg-white/10"
        >
          Return to Hub
        </button>
      </div>
    );
  }

  const isP1 = user?.id === currentMatch.playerOneId;
  const myScore = isP1
    ? currentMatch.playerOneScore
    : currentMatch.playerTwoScore;
  const opponentScore = isP1
    ? currentMatch.playerTwoScore
    : currentMatch.playerOneScore;

  // Determine my and opponent data
  const myData = isP1
    ? { id: currentMatch.playerOneId, username: user?.username || "You" }
    : { id: currentMatch.playerTwoId, username: user?.username || "You" };

  const opponentData = isP1
    ? { id: currentMatch.playerTwoId, username: "Opponent", score: 0 }
    : { id: currentMatch.playerOneId, username: "Opponent", score: 0 };

  const latestRound = currentMatch.rounds[currentMatch.rounds.length - 1];

  // Extract current choices
  const myChoice = latestRound?.myChoice || null;
  const opponentChoice = latestRound?.opponentChoice || null;

  const getChoiceStyles = (choice: GameChoice | null) => {
    if (!choice) return "";
    switch (choice) {
      case "ROCK":
        return "border-orange-500 bg-orange-500/10 text-orange-400";
      case "PAPER":
        return "border-emerald-500 bg-emerald-500/10 text-emerald-400";
      case "SCISSORS":
        return "border-blue-500 bg-blue-500/10 text-blue-400";
      default:
        return "border-white/10 bg-white/5";
    }
  };

  const renderChoiceIcon = (
    choice: GameChoice | null,
    sizeClass: string = "h-6 w-6",
  ) => {
    switch (choice) {
      case "ROCK":
        return <Flame className={`${sizeClass} text-orange-400`} />;
      case "PAPER":
        return <FileText className={`${sizeClass} text-emerald-400`} />;
      case "SCISSORS":
        return <Scissors className={`${sizeClass} text-blue-400`} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between gap-8 py-4 relative z-10">
      {/* Background design glow */}
      <div className="absolute top-1/2 left-1/2 h-112.5 w-112.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      {/* 1. ROOM HEADER (Top bar with series overview & leave button) */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-blue-400">
              Battle Room
            </span>
            <span className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400">
              {"NORMAL"}
            </span>
          </div>
          <span className="font-mono text-[10px] text-zinc-500">
            ID: {currentMatch.matchId}
          </span>
        </div>

        {/* TOP MIDDLE ROUND TOKENS */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
            Round Status
          </span>
          <div className="flex items-center gap-3">
            {[1, 2, 3].map((roundNum) => {
              const rHistory = currentMatch.rounds[roundNum - 1];
              let color = "bg-white/5 border-white/10 text-zinc-400";
              let text = "";

              if (rHistory) {
                if (rHistory.status === "PENDING") {
                  color =
                    "bg-amber-500/20 border-amber-500/40 shadow-lg shadow-amber-500/10 text-amber-400";
                  text = "D";
                } else if (Number(rHistory.winnerId) === user?.id) {
                  color =
                    "bg-green-500/20 border-green-500/40 shadow-lg shadow-green-500/10 text-green-400";
                  text = "W";
                } else {
                  color =
                    "bg-rose-500/20 border-rose-500/40 shadow-lg shadow-rose-500/10 text-rose-400";
                  text = "L";
                }
              } else if (
                currentMatch.currentRoundNumber === roundNum &&
                currentMatch.status !== "FINISHED" &&
                currentMatch.status !== "CANCELLED"
              ) {
                color =
                  "bg-blue-500/20 border-blue-500 animate-pulse shadow-lg shadow-blue-500/25 text-white";
                text = roundNum.toString();
              } else {
                text = roundNum.toString();
              }

              return (
                <div
                  key={roundNum}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border font-mono text-xs font-extrabold transition-all duration-300 ${color}`}
                >
                  {text}
                </div>
              );
            })}
          </div>
        </div>

        {/* Abandon Match Button */}
        {currentMatch.status === "WAITING_FOR_PLAYERS" ||
        currentMatch.status === "IN_PROGRESS" ||
        currentMatch.status === "FINISHED" ? (
          <button
            onClick={() => setShowForfeitModal(true)}
            id="forfeit-match-button"
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            Abandon
          </button>
        ) : (
          <button
            onClick={handleLeaveRoom}
            id="leave-room-button"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:bg-white/10 transition-all cursor-pointer"
          >
            Return to Hub
          </button>
        )}
      </div>

      {/* 2. DUAL PLAYER SPLIT VIEWPORT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch flex-1">
        {/* PLAYER 1 (Left Panel: YOU) */}
        <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 h-2 bg-blue-500 w-1/3" />

          {/* Player stats */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
                Player 1 (You)
              </span>
              <span className="font-mono text-xs text-zinc-400">RP: 1200</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
              {myData?.username}
              <span className="rounded bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-blue-400">
                LOBBY
              </span>
            </h3>

            {/* Score */}
            <div className="mt-4 flex items-center gap-2 bg-white/5 border border-white/10 p-3 rounded-xl max-w-max">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                Rounds Won:
              </span>
              <span className="font-mono text-lg font-extrabold text-blue-400">
                {myScore}
              </span>
            </div>
          </div>

          {/* Visual Choice Representation during phases */}
          <div className="my-8 flex items-center justify-center min-h-40">
            {currentMatch.status === "WAITING_FOR_PLAYERS" && (
              <div className="flex flex-col items-center text-center gap-2 text-zinc-500">
                <span className="text-xs font-bold uppercase tracking-wider animate-pulse">
                  Arming Combat systems...
                </span>
              </div>
            )}

            {currentMatch.status === "IN_PROGRESS" && (
              <AnimatePresence mode="wait">
                {myChoice ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`flex flex-col items-center gap-3 border p-5 rounded-2xl ${getChoiceStyles(myChoice)}`}
                  >
                    {renderChoiceIcon(myChoice)}
                    <span className="text-xs font-black uppercase tracking-wider">
                      Option Locked
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center text-center gap-2 text-zinc-500 border border-dashed border-white/10 p-8 rounded-2xl w-full bg-white/5 backdrop-blur-sm"
                  >
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 animate-pulse">
                      Select your action below
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {currentMatch.status === "FINISHED" && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`flex flex-col items-center gap-3 border p-6 rounded-2xl ${getChoiceStyles(myChoice)}`}
              >
                {renderChoiceIcon(myChoice)}
                <span className="text-xs font-black uppercase tracking-wider">
                  Revealed: {myChoice}
                </span>
              </motion.div>
            )}

            {/* {(currentMatch.status === "FINISHED" ||
              currentMatch.status === "CANCELLED") && (
              <div className="text-center">
                {Number(currentMatch.winnerId) === myData?.id ? (
                  <div className="text-green-400 flex flex-col items-center gap-2">
                    <Trophy className="h-14 w-14 animate-bounce" />
                    <span className="font-black text-xl uppercase tracking-wider">
                      Victory
                    </span>
                    <span className="text-xs text-green-500 font-semibold uppercase">
                      +{currentMatch.mode === "rank" ? "25" : "0"} RP Awarded
                    </span>
                  </div>
                ) : currentMatch.winnerId === -1 ? (
                  <div className="text-zinc-400 flex flex-col items-center gap-2">
                    <span className="font-black text-xl uppercase tracking-wider">
                      Draw Match
                    </span>
                    <span className="text-xs text-zinc-500 font-semibold uppercase">
                      +{currentMatch.mode === "rank" ? "5" : "0"} RP
                    </span>
                  </div>
                ) : (
                  <div className="text-rose-400 flex flex-col items-center gap-2">
                    <span className="font-black text-xl uppercase tracking-wider">
                      Defeat
                    </span>
                    <span className="text-xs text-rose-500 font-semibold uppercase">
                      {currentMatch.mode === "rank" ? "-15" : "0"} RP
                    </span>
                  </div>
                )}
              </div>
            )} */}
          </div>

          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
              Combat Panel
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(["ROCK", "PAPER", "SCISSORS"] as GameChoice[]).map((option) => {
                const disabled =
                  currentMatch.status !== "IN_PROGRESS" ||
                  !!myChoice ||
                  choiceSubmitting;
                const isSelected =
                  localChoice === option || myChoice === option;
                const styles = getChoiceStyles(option);

                return (
                  <button
                    key={option}
                    onClick={() => handleSelectChoice(option)}
                    disabled={disabled}
                    id={`choice-button-${option}`}
                    className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      isSelected
                        ? `${styles} ring-2 ring-blue-500/40 scale-95 shadow-lg`
                        : disabled
                          ? "border-white/5 bg-[#09090b]/20 text-zinc-700 opacity-40"
                          : "border-white/10 bg-[#09090b]/80 text-zinc-400 hover:bg-white/10 hover:text-white hover:scale-[1.03]"
                    }`}
                  >
                    {renderChoiceIcon(option)}
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* PLAYER 2 (Right Panel: OPPONENT) */}
        <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 h-2 bg-rose-500 w-1/3" />

          {/* Opponent Stats */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
                Player 2 (Opponent)
              </span>
              <span className="font-mono text-xs text-zinc-400">
                RP: {opponentData?.score}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
              {opponentData?.username}
              <span className="rounded bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-rose-400">
                {String(opponentData?.id).startsWith("bot_")
                  ? "NPC BOT"
                  : "PLAYER"}
              </span>
            </h3>

            {/* Score */}
            <div className="mt-4 flex items-center gap-2 bg-white/5 border border-white/10 p-3 rounded-xl max-w-max">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                Rounds Won:
              </span>
              <span className="font-mono text-lg font-extrabold text-rose-400">
                {opponentScore}
              </span>
            </div>
          </div>

          {/* Visual Choice state for Opponent */}
          <div className="my-8 flex items-center justify-center min-h-40">
            {currentMatch.status === "WAITING_FOR_PLAYERS" && (
              <div className="flex flex-col items-center text-center gap-2 text-zinc-500 animate-pulse">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Syncing link...
                </span>
              </div>
            )}

            {currentMatch.status === "IN_PROGRESS" && (
              <AnimatePresence mode="wait">
                {opponentChoice ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-2 border border-white/10 bg-white/5 p-6 rounded-2xl text-zinc-300 shadow-md backdrop-blur-sm"
                  >
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-500/10">
                      <Sparkles className="h-5 w-5 text-blue-400 animate-spin" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-blue-400">
                      Decision Locked
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center text-center gap-2 text-zinc-500 border border-dashed border-white/10 p-8 rounded-2xl w-full bg-white/5 backdrop-blur-sm"
                  >
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 animate-pulse">
                      Awaiting Opponent
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {currentMatch.status === "FINISHED" && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`flex flex-col items-center gap-3 border p-6 rounded-2xl ${getChoiceStyles(opponentChoice)}`}
              >
                {renderChoiceIcon(opponentChoice, "h-14 w-14 animate-bounce")}
                <span className="text-xs font-black uppercase tracking-wider">
                  Revealed: {opponentChoice}
                </span>
              </motion.div>
            )}

            {(currentMatch.status === "FINISHED" ||
              currentMatch.status === "CANCELLED") && (
              <div className="text-center">
                {Number(currentMatch.winnerId) === opponentData?.id ? (
                  <div className="text-green-400 flex flex-col items-center gap-2">
                    <Trophy className="h-14 w-14 animate-bounce" />
                    <span className="font-black text-xl uppercase tracking-wider">
                      Victory
                    </span>
                  </div>
                ) : currentMatch.winnerId === -1 ? (
                  <div className="text-zinc-400 flex flex-col items-center gap-2">
                    <span className="font-black text-xl uppercase tracking-wider">
                      Draw Match
                    </span>
                  </div>
                ) : (
                  <div className="text-rose-400 flex flex-col items-center gap-2">
                    <span className="font-black text-xl uppercase tracking-wider">
                      Defeat
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Combat history round review logs */}
          <div className="rounded-xl border border-white/5 bg-white/5 p-4 min-h-22.5 flex flex-col justify-center backdrop-blur-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1.5">
              Round Clash Logs
            </span>
            <div className="text-xs font-medium text-zinc-400 flex flex-col gap-1">
              {currentMatch.rounds.length === 0 ? (
                <span className="italic text-zinc-500">
                  No round clashes recorded yet.
                </span>
              ) : (
                <div>Round history will appear here</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. CENTER OVERLAY COUNTDOWN CLOCK & ROUND CARD */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-33.75 flex flex-col items-center z-10">
        <div className="flex flex-col items-center bg-[#09090b] border border-white/10 rounded-full px-5 py-3 shadow-2xl backdrop-blur-md">
          {/* Phase Details Title */}
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 animate-pulse text-center">
            {currentMatch.status === "WAITING_FOR_PLAYERS"
              ? `Round ${currentMatch.currentRoundNumber} Begins`
              : currentMatch.status === "IN_PROGRESS"
                ? "Locked Combat"
                : currentMatch.status === "FINISHED"
                  ? "Next Match Prep"
                  : "Final Standings"}
          </span>

          {/* Countdown Clock (Monospace timer digits) */}
          {/* <span
            className={`font-mono text-3xl font-black ${currentMatch.roundTimer <= 3 ? "text-rose-500 animate-ping" : "text-white"}`}
          >
            00:{(currentMatch.roundTimer || 0).toString().padStart(2, "0")}
          </span> */}
        </div>
      </div>

      {/* 4. CONFIRM FORFEIT LOBBY ABANDON MODAL */}
      <AnimatePresence>
        {showForfeitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#121214] p-6 shadow-2xl backdrop-blur-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 mx-auto">
                <AlertOctagon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-center text-lg font-black uppercase text-white">
                Forfeit Match?
              </h3>
              <p className="mt-2 text-center text-xs text-zinc-400 leading-relaxed">
                Exiting now will declare you defeated. You will lose{" "}
                <span className="font-bold text-rose-400">-30 RP</span> from
                your Ranked record. Are you certain you want to abandon?
              </p>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => setShowForfeitModal(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-bold uppercase text-zinc-400 hover:bg-white/10 cursor-pointer"
                >
                  Stay & Fight
                </button>
                <button
                  onClick={handleLeaveRoom}
                  id="confirm-forfeit-button"
                  className="flex-1 rounded-xl bg-rose-600 py-3 text-xs font-bold uppercase text-white hover:bg-rose-500 cursor-pointer shadow-lg shadow-rose-600/20"
                >
                  Yes, Surrender
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
