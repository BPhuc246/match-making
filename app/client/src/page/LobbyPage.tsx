import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Swords, Trophy, History, Play } from "lucide-react";
import toast from "react-hot-toast";
import type { AppDispatch, RootState } from "../store";
import PlayerProfileWidget from "../components/PlayerProfileWidget";
import LeaderboardList from "../components/LeaderboardList";
import { fetch } from "../feature/authThunk";
import { startQueue } from "../feature/queueThunk";
import { setMatched } from "../store/globalSlice";
import { connectSocket, disconnectSocket } from "../lib/socket";

export default function LobbyPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { user } = useSelector((state: RootState) => state.auth);
  const {
    isQueuing,
    queueMode,
    matchedRoomId,
    leaderboard,
    leaderboardStatus,
  } = useSelector((state: RootState) => state.global);

  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // 1. Fetch user + leaderboard on mount
  useEffect(() => {
    dispatch(fetch())
      .unwrap()
      .then((res) => {
        if (!res) navigate("/auth");
      })
      .catch(() => {
        navigate("/auth");
      });

    setLeaderboardLoading(true);
    // axiosInstance.get("/users/leaderboard")
    //   .then((res) => dispatch(setLeaderboard(res.data)))
    //   .catch((err) => console.error("Leaderboard fetch error", err))
    //   .finally(() => setLeaderboardLoading(false));
  }, [dispatch, navigate]);

  // 2. Open the socket once on mount — NOT tied to isQueuing/queueMode,
  //    so it doesn't reconnect on every queue state change.
  useEffect(() => {
    connectSocket((payload) => {
      if (payload.status === "MATCHED") {
        dispatch(setMatched(payload));
        toast.success("Match found! Ready up!", {
          icon: "⚔️",
          style: {
            background: "#0f172a",
            color: "#f8fafc",
            border: "1px solid #10b981",
          },
        });
      }
    });

    return () => disconnectSocket();
  }, [dispatch]);

  // 3. Redirect once matchedRoomId is set by the socket push
  useEffect(() => {
    if (matchedRoomId) {
      navigate(`/room/${matchedRoomId}`);
    }
  }, [matchedRoomId, navigate]);

  const handleStartQueue = (mode: "casual" | "rank") => {
    if (isQueuing) {
      toast.error("Already in matchmaking queue!");
      return;
    }

    dispatch(startQueue(mode))
      .unwrap()
      .then((res) => {
        if (res.status === "WAITING") {
          toast.success(`Searching for ${mode} opponent...`, {
            icon: "🔍",
            style: {
              background: "#0f172a",
              color: "#f8fafc",
              border: "1px solid #6366f1",
            },
          });
        }
        // If status is already "MATCHED" here (this player was the second joiner),
        // globalSlice.startQueue.fulfilled should set matchedRoomId directly —
        // no toast needed here since the socket push (or the reducer) handles navigation.
      })
      .catch((err) => {
        toast.error(err || "Matchmaking request failed");
      });
  };

  if (!user) return null;

  return (
    <div className="flex-1 flex flex-col gap-8 relative z-10">
      {/* Visual background atmospheric lights */}
      <div className="absolute top-0 right-1/4 h-100 w-100 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-10 h-75 w-75 rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      {/* Header Greeting Banner */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black uppercase tracking-wider text-white sm:text-3.5xl">
          CHALLENGERS <span className="text-blue-400">HUB</span>
        </h1>
        <p className="text-xs text-zinc-400 sm:text-sm">
          Challenge online competitors or test tactics against our simulated
          trainers. Keep your win rates elevated!
        </p>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left 2 Columns: Player Stats and Lobbies */}
        <div className="flex flex-col gap-8 lg:col-span-2">
          {/* Profile Overview */}
          <PlayerProfileWidget user={user} />

          {/* Mode Selection / Play Match Panel */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Swords className="h-5 w-5 text-blue-400 animate-pulse" />
              Battle Arena Modes
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Select Ranked Match to compete for Leaderboard rating points (LP)
              or Casual Match for a stress-free warm up.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Casual Match Block */}
              <button
                onClick={() => handleStartQueue("casual")}
                disabled={isQueuing}
                id="join-casual-queue-button"
                className={`group relative overflow-hidden rounded-xl border p-5 text-left transition-all duration-300 cursor-pointer ${
                  isQueuing && queueMode === "casual"
                    ? "border-blue-500/50 bg-blue-500/10 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10"
                    : "border-white/10 bg-[#121214]/40 hover:border-white/20 hover:bg-[#121214]/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white group-hover:text-blue-400 transition-colors">
                    Casual Match
                  </span>
                  <Play
                    className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${
                      isQueuing && queueMode === "casual"
                        ? "text-blue-400"
                        : "text-zinc-500 group-hover:text-zinc-300"
                    }`}
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                  Refine strategies without risking rating points. Matches with
                  simulated bot fallbacks after 4 seconds of searching.
                </p>
                {isQueuing && queueMode === "casual" && (
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-blue-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
                    Searching...
                  </span>
                )}
              </button>

              {/* Ranked Match Block */}
              <button
                onClick={() => handleStartQueue("rank")}
                disabled={isQueuing}
                id="join-rank-queue-button"
                className={`group relative overflow-hidden rounded-xl border p-5 text-left transition-all duration-300 cursor-pointer ${
                  isQueuing && queueMode === "rank"
                    ? "border-amber-500/50 bg-amber-500/10 ring-2 ring-amber-500/20 shadow-lg shadow-amber-500/10"
                    : "border-white/10 bg-[#121214]/40 hover:border-white/20 hover:bg-[#121214]/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white group-hover:text-amber-400 transition-colors">
                    Ranked Match
                  </span>
                  <Trophy
                    className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${
                      isQueuing && queueMode === "rank"
                        ? "text-amber-400 animate-bounce"
                        : "text-zinc-500 group-hover:text-zinc-300"
                    }`}
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                  Earn +25 RP on wins and lose -15 RP on losses. Climb ranks
                  from Bronze up to Grandmaster. Bot backup enabled.
                </p>
                {isQueuing && queueMode === "rank" && (
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                    Searching...
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Match History logs */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <History className="h-5 w-5 text-blue-400" />
              Recent Combat Operations
            </h2>
            {/* <MatchHistoryTable matches={user.matches || []} /> */}
          </div>
        </div>

        {/* Right 1 Column: Global Leaderboard */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          <h2 className="text-lg font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400 animate-pulse" />
            Top Arena Standings
          </h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-md">
            <p className="mb-4 text-xs text-zinc-400">
              The highest scoring grandmasters currently competing in the Rock
              Paper Scissors matches.
            </p>
            <LeaderboardList
              leaderboard={leaderboard}
              loading={leaderboardLoading && leaderboardStatus !== "succeeded"}
              currentUser={user}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
