import { Trophy, Star, Shield } from "lucide-react";
import type { User } from "../types/userInterface";

interface LeaderboardListProps {
  leaderboard: User[];
  loading: boolean;
  currentUser?: User | null;
}

export default function LeaderboardList({
  leaderboard,
  loading,
  currentUser,
}: LeaderboardListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3 py-6">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div
            key={idx}
            className="h-14 animate-pulse rounded-xl border border-slate-800/40 bg-slate-900/10"
          />
        ))}
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/20 p-8 text-center text-slate-400">
        <Star className="h-8 w-8 text-slate-500 animate-spin" />
        <span className="mt-2 text-sm font-semibold">No rankings available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {leaderboard.map((user, index) => {
        const rankIndex = index + 1;
        const isSelf = currentUser && currentUser.id === user.id;

        // Custom styling for top 3
        const getPodiumStyle = (rank: number) => {
          switch (rank) {
            case 1:
              return {
                bg: "bg-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-500/5",
                medalColor: "text-amber-400 animate-pulse",
                badgeBg: "bg-amber-500/20 text-amber-300",
              };
            case 2:
              return {
                bg: "bg-zinc-400/10 border-zinc-400/20 shadow-lg shadow-zinc-400/5",
                medalColor: "text-zinc-300",
                badgeBg: "bg-zinc-400/20 text-zinc-300",
              };
            case 3:
              return {
                bg: "bg-amber-700/10 border-amber-700/20 shadow-lg shadow-amber-700/5",
                medalColor: "text-amber-600",
                badgeBg: "bg-amber-700/20 text-amber-400",
              };
            default:
              return {
                bg: isSelf
                  ? "bg-blue-500/10 border-blue-500/30 shadow-lg shadow-blue-500/5"
                  : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10",
                medalColor: "text-zinc-500",
                badgeBg: "bg-white/5 text-zinc-400",
              };
          }
        };

        const podium = getPodiumStyle(rankIndex);
        const winRate =
          user.wins + user.losses + user.draws > 0
            ? Math.round((user.wins / (user.wins + user.losses + user.draws)) * 100)
            : 0;

        return (
          <div
            key={user.id}
            className={`flex items-center justify-between rounded-xl border p-3.5 transition-all duration-300 ${podium.bg}`}
          >
            <div className="flex items-center gap-3">
              {/* Placement badge/icon */}
              <div className="flex h-8 w-8 items-center justify-center font-bold">
                {rankIndex <= 3 ? (
                  <Trophy className={`h-6 w-6 ${podium.medalColor}`} />
                ) : (
                  <span className="font-mono text-zinc-400 text-sm">#{rankIndex}</span>
                )}
              </div>

              {/* Player details */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm sm:text-base">
                    {user.username}
                  </span>
                  {isSelf && (
                    <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-blue-300 border border-blue-500/30">
                      You
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400">
                  <span className="flex items-center gap-0.5 uppercase tracking-wide text-[10px] font-bold text-zinc-500">
                    <Shield className="h-3 w-3" />
                    {user.rank}
                  </span>
                  <span className="text-[10px] text-zinc-600">•</span>
                  <span>
                    {user.wins}W / {user.losses}L ({winRate}% WR)
                  </span>
                </div>
              </div>
            </div>

            {/* Score pill */}
            <div className="text-right">
              <span className="font-mono font-black text-white sm:text-lg">
                {user.score}
              </span>
              <span className="ml-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                RP
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
