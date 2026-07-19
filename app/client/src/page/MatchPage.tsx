import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  AlertOctagon,
  RefreshCw,
  FileText,
  Flame,
  LogOut,
  Scissors,
  Sparkles,
  Clock,
  Home,
} from "lucide-react";
import toast from "react-hot-toast";
import type { GameChoice } from "../types/matchInterface";
import type { AppDispatch, RootState } from "../store";
import { fetchMatch, submitChoice, leaveMatch } from "../feature/matchThunk";
import { matchStateUpdated } from "../store/matchSlice";
import { clearMatchedMatchId } from "../store/globalSlice";
import { AnimatePresence, motion } from "motion/react";
import {
  subscribeToRoundUpdates,
  unsubscribeFromRoundUpdates,
} from "../lib/socket";

const ROUND_TIME_SECONDS = 30;

export default function MatchPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { currentMatch, status, choiceSubmitting, error } = useSelector(
    (state: RootState) => state.match,
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const [localChoice, setLocalChoice] = useState<GameChoice | null>(null);
  const [showForfeitModal, setShowForfeitModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME_SECONDS);
  const isTimerRunning = currentMatch?.rounds.at(-1)?.status === "PENDING";

  const prevRoundRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  const getErrorMessage = (err: unknown): string => {
    if (!err) return "An unknown error occurred";
    if (typeof err === "string") return err;
    if (err instanceof Error) return err.message;
    if (typeof err === "object") {
      const maybe = err as { message?: string; code?: string };
      return maybe.message ?? maybe.code ?? "Failed to submit choice";
    }
    return "Failed to submit choice";
  };

  // Timer logic
  useEffect(() => {
    if (!isTimerRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // Start / Reset timer when new round starts
  useEffect(() => {
    if (!currentMatch) return;
    const currentRoundNum = currentMatch.currentRoundNumber || 1;
    if (currentRoundNum > prevRoundRef.current) {
      setLocalChoice(null);
      setTimeLeft(ROUND_TIME_SECONDS);
      prevRoundRef.current = currentRoundNum;
    }
  }, [currentMatch]);

  useEffect(() => {
    if (!matchId) return;
    dispatch(fetchMatch(matchId));
    subscribeToRoundUpdates((payload) => {
      if (String(payload.matchId) === matchId) {
        dispatch(matchStateUpdated(payload));
      }
    });

    return () => unsubscribeFromRoundUpdates();
  }, [matchId, dispatch]);
  // Clear matched flag
  useEffect(() => {
    dispatch(clearMatchedMatchId());
  }, [dispatch]);

  // Toast on match finish
  useEffect(() => {
    if (currentMatch?.status === "FINISHED" && user) {
      const isP1 = user.id === currentMatch.playerOneId;
      const myScore = isP1
        ? currentMatch.playerOneScore
        : currentMatch.playerTwoScore;
      const oppScore = isP1
        ? currentMatch.playerTwoScore
        : currentMatch.playerOneScore;

      if (currentMatch.winnerId === -1) {
        toast("It's a draw!", { icon: "🤝" });
      } else if (currentMatch.winnerId === user.id) {
        toast.success(`You won! ${myScore} - ${oppScore}`, { icon: "🏆" });
      } else {
        toast.error(`You lost. ${myScore} - ${oppScore}`, { icon: "💔" });
      }
    }
  }, [currentMatch, user]);

  // Reset local choice on new round
  useEffect(() => {
    if (!currentMatch) return;
    const currentRoundNum = currentMatch.currentRoundNumber || 1;
    if (currentRoundNum > prevRoundRef.current) {
      setLocalChoice(null);
      prevRoundRef.current = currentRoundNum;
    }
  }, [currentMatch?.currentRoundNumber]);

  const handleSelectChoice = (choice: GameChoice) => {
    if (!matchId || choiceSubmitting) return;

    const latestRound = currentMatch?.rounds[currentMatch.rounds.length - 1];
    if (latestRound?.status !== "PENDING" || latestRound.myChoice) return;

    setLocalChoice(choice);

    dispatch(submitChoice({ matchId, choice }))
      .unwrap()
      .then(() => {
        toast.success(`Locked in: ${choice}!`, { duration: 1200 });
      })
      .catch((err) => {
        const msg = getErrorMessage(err);
        toast.error(msg);
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

  // Safe error display
  if (error || !currentMatch) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <AlertOctagon className="h-10 w-10 text-rose-500 animate-bounce" />
        <h3 className="text-lg font-bold text-white">Connection Issue</h3>
        <p className="text-sm text-zinc-400 max-w-xs">
          {getErrorMessage(error)}
        </p>
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

  const latestRound = currentMatch.rounds[currentMatch.rounds.length - 1];
  const myChoice = latestRound?.myChoice || null;
  const opponentChoice = latestRound?.opponentChoice || null;

  const getChoiceStyles = (choice: GameChoice | null) => {
    if (!choice) return "border-white/10 bg-white/5";
    switch (choice) {
      case "ROCK":
        return "border-orange-500 bg-orange-500/10 text-orange-400";
      case "PAPER":
        return "border-emerald-500 bg-emerald-500/10 text-emerald-400";
      case "SCISSORS":
        return "border-blue-500 bg-blue-500/10 text-blue-400";
    }
  };

  const renderChoiceIcon = (choice: GameChoice | null, size = "h-8 w-8") => {
    switch (choice) {
      case "ROCK":
        return <Flame className={`${size} text-orange-400`} />;
      case "PAPER":
        return <FileText className={`${size} text-emerald-400`} />;
      case "SCISSORS":
        return <Scissors className={`${size} text-blue-400`} />;
      default:
        return null;
    }
  };

  // Final Result Screen
  if (currentMatch.status === "FINISHED") {
    const isWinner = currentMatch.winnerId === user?.id;
    const isDraw = currentMatch.winnerId === -1;
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen gap-8 text-center px-4">
        <div
          className={`text-8xl ${isWinner ? "text-yellow-400" : isDraw ? "text-zinc-400" : "text-rose-500"}`}
        >
          {isWinner ? "🏆" : isDraw ? "🤝" : "💔"}
        </div>

        <h2 className="text-4xl font-black">
          {isWinner ? "VICTORY" : isDraw ? "DRAW" : "DEFEAT"}
        </h2>

        <p className="text-2xl font-mono text-zinc-400">
          {myScore} - {opponentScore}
        </p>

        <div className="flex gap-4 mt-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold text-lg"
          >
            <Home className="h-6 w-6" />
            Return to Hub
          </button>
          <button
            onClick={() => window.location.reload()} // or navigate to queue
            className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold text-lg"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  const isPending = latestRound?.status === "PENDING";
  const canChoose = isPending && !myChoice && !choiceSubmitting;
  const bothLocked = myChoice && opponentChoice;

  return (
    <div className="flex-1 flex flex-col justify-between gap-8 py-4 relative z-10 min-h-screen">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 h-112.5 w-112.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 px-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-blue-400">
              BATTLE ROOM
            </span>
            <span className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-zinc-400">
              NORMAL
            </span>
          </div>
          <span className="font-mono text-[10px] text-zinc-500">
            ID: {currentMatch.matchId}
          </span>
        </div>

        {/* Round Indicators */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
            ROUND
          </span>
          <div className="flex gap-2">
            {[1, 2, 3].map((n) => {
              const round = currentMatch.rounds[n - 1];
              let cls = "bg-white/5 border-white/10 text-zinc-400";
              let txt = n.toString();

              if (round?.status === "COMPLETED") {
                if (round.winnerId === -1) {
                  cls = "bg-amber-500/20 border-amber-500 text-amber-400";
                  txt = "D";
                } else if (round.winnerId === user?.id) {
                  cls = "bg-green-500/20 border-green-500 text-green-400";
                  txt = "W";
                } else {
                  cls = "bg-rose-500/20 border-rose-500 text-rose-400";
                  txt = "L";
                }
              } else if (round?.status === "PENDING") {
                cls = "bg-blue-500/30 border-blue-500 text-white animate-pulse";
              }

              return (
                <div
                  key={n}
                  className={`h-9 w-9 flex items-center justify-center rounded-full border font-mono text-sm font-bold transition-all ${cls}`}
                >
                  {txt}
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => setShowForfeitModal(true)}
          className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-rose-400 hover:bg-rose-500/20"
        >
          <LogOut className="h-4 w-4" />
          ABANDON
        </button>
      </div>

      {/* SPLIT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 px-2">
        {/* YOU */}
        <div className="flex flex-col rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 relative">
          <div className="absolute top-0 left-0 h-1.5 bg-blue-500 w-2/5 rounded-r" />

          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-zinc-400">
                YOU
              </div>
              <h3 className="text-2xl font-bold text-white mt-1">
                {user?.username}
              </h3>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-400">SCORE</div>
              <div className="text-3xl font-mono font-black text-blue-400">
                {myScore}
              </div>
            </div>
          </div>

          {/* Choice Display */}
          <div className="flex-1 flex items-center justify-center my-8 min-h-45">
            <AnimatePresence mode="wait">
              {myChoice ? (
                <motion.div
                  key={`mine-${currentMatch.currentRoundNumber}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`flex flex-col items-center gap-4 p-8 rounded-2xl border-2 ${getChoiceStyles(myChoice)}`}
                >
                  {renderChoiceIcon(myChoice, "h-16 w-16")}
                  <span className="font-black uppercase tracking-widest">
                    LOCKED
                  </span>
                </motion.div>
              ) : (
                <div
                  key={`mine-empty-${currentMatch.currentRoundNumber}`}
                  className="text-center text-zinc-500"
                >
                  <div className="text-6xl mb-4 opacity-30">🤜</div>
                  <p className="font-mono uppercase tracking-widest text-sm">
                    Choose your move
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Choice Buttons - More prominent */}
          <div className="grid grid-cols-3 gap-3 mt-auto">
            {(["ROCK", "PAPER", "SCISSORS"] as const).map((option) => (
              <button
                key={option}
                onClick={() => handleSelectChoice(option)}
                disabled={!canChoose}
                className={`flex flex-col items-center gap-3 p-6 rounded-2xl border font-bold uppercase tracking-wider transition-all text-sm ${
                  canChoose
                    ? "hover:scale-105 active:scale-95"
                    : "opacity-40 cursor-not-allowed"
                } ${
                  localChoice === option || myChoice === option
                    ? getChoiceStyles(option) + " ring-2 ring-blue-400 scale-95"
                    : "border-white/10 bg-zinc-950/70 hover:bg-white/5"
                }`}
              >
                {renderChoiceIcon(option, "h-10 w-10")}
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* OPPONENT */}
        <div className="flex flex-col rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 relative">
          <div className="absolute top-0 right-0 h-1.5 bg-rose-500 w-2/5 rounded-l" />

          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-zinc-400">
                OPPONENT
              </div>
              <h3 className="text-2xl font-bold text-white mt-1">Opponent</h3>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-400">SCORE</div>
              <div className="text-3xl font-mono font-black text-rose-400">
                {opponentScore}
              </div>
            </div>
          </div>

          <div className="flex flex-col rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 relative">
            <div className="flex-1 flex items-center justify-center my-8 min-h-45">
              <AnimatePresence mode="wait">
                {opponentChoice ? (
                  <motion.div
                    key={`opp-locked-${currentMatch.currentRoundNumber}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`flex flex-col items-center gap-4 p-8 rounded-2xl border-2 ${getChoiceStyles(opponentChoice)}`}
                  >
                    {renderChoiceIcon(opponentChoice, "h-16 w-16")}
                    <span className="font-black uppercase tracking-widest">
                      LOCKED
                    </span>
                  </motion.div>
                ) : isPending ? (
                  <motion.div
                    key={`opp-waiting-${currentMatch.currentRoundNumber}`}
                    animate={{ opacity: [0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-center"
                  >
                    <Sparkles className="h-12 w-12 mx-auto animate-spin text-blue-400" />
                    <p className="mt-4 text-sm uppercase tracking-widest">
                      Opponent is choosing...
                    </p>
                  </motion.div>
                ) : (
                  <p
                    key={`opp-idle-${currentMatch.currentRoundNumber}`}
                    className="text-zinc-500"
                  >
                    Waiting for next round...
                  </p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Big Central Timer + Status */}
          {isPending && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-zinc-950/90 border border-white/10 rounded-full px-4 py-1.5 shadow-lg backdrop-blur-md"
              >
                <Clock className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Round {currentMatch.currentRoundNumber}
                </span>
                <span
                  className={`font-mono text-sm font-black ${timeLeft <= 5 ? "text-rose-500" : "text-white"}`}
                >
                  00:{timeLeft.toString().padStart(2, "0")}
                </span>
                {bothLocked && (
                  <span className="text-[10px] font-bold text-green-400 uppercase tracking-wide">
                    Resolving...
                  </span>
                )}
              </motion.div>
            </div>
          )}

          {/* Round History Placeholder */}
          <div className="mt-auto rounded-2xl border border-white/5 bg-white/5 p-4 text-xs text-zinc-400">
            Round history will appear here after clashes
          </div>
        </div>
      </div>

      {/* Forfeit Modal */}
      <AnimatePresence>
        {showForfeitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-sm w-full bg-zinc-900 rounded-3xl p-8 border border-white/10"
            >
              <AlertOctagon className="mx-auto h-12 w-12 text-rose-500" />
              <h3 className="text-2xl font-black text-center mt-6">
                Forfeit Match?
              </h3>
              <p className="text-zinc-400 text-center mt-3">
                You will lose <span className="text-rose-400">-30 RP</span>.
              </p>

              <div className="grid grid-cols-2 gap-3 mt-8">
                <button
                  onClick={() => setShowForfeitModal(false)}
                  className="py-4 rounded-2xl border border-white/10 hover:bg-white/5 font-bold"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleLeaveRoom}
                  className="py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 font-bold"
                >
                  SURRENDER
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {latestRound?.status === "COMPLETED" && (
          <motion.div
            key={`result-${latestRound.roundNumber}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-32 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
          >
            <div
              className={`rounded-xl border px-6 py-2 font-black uppercase tracking-widest text-sm shadow-xl backdrop-blur-md ${
                latestRound.winnerId === -1
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                  : latestRound.winnerId === user?.id
                    ? "bg-green-500/20 border-green-500/50 text-green-300"
                    : "bg-rose-500/20 border-rose-500/50 text-rose-300"
              }`}
            >
              {latestRound.winnerId === -1
                ? "Round Draw"
                : latestRound.winnerId === user?.id
                  ? "You Won This Round"
                  : "You Lost This Round"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
