import { Shield, Trophy, Percent } from "lucide-react";
import type { User } from "../types/userInterface";

interface PlayerProfileWidgetProps {
  user: User;
}

export default function PlayerProfileWidget({ user }: PlayerProfileWidgetProps) {
  const totalMatches = user.wins + user.losses + user.draws;
  const winRate = totalMatches > 0 ? Math.round((user.wins / totalMatches) * 100) : 0;

  // Custom visual theme depending on rank
  const getRankTheme = (rank: string) => {
    switch (rank) {
      case "Grandmaster":
        return {
          bg: "bg-fuchsia-950/30 border-fuchsia-500/50 shadow-fuchsia-500/10",
          text: "text-fuchsia-400",
          badge: "bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400",
          glow: "shadow-fuchsia-500/20",
        };
      case "Diamond":
        return {
          bg: "bg-cyan-950/30 border-cyan-500/50 shadow-cyan-500/10",
          text: "text-cyan-400",
          badge: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
          glow: "shadow-cyan-500/20",
        };
      case "Platinum":
        return {
          bg: "bg-teal-950/30 border-teal-500/50 shadow-teal-500/10",
          text: "text-teal-400",
          badge: "bg-teal-500/10 border-teal-500/30 text-teal-400",
          glow: "shadow-teal-500/20",
        };
      case "Gold":
        return {
          bg: "bg-amber-950/30 border-amber-500/50 shadow-amber-500/10",
          text: "text-amber-400",
          badge: "bg-amber-500/10 border-amber-500/30 text-amber-400",
          glow: "shadow-amber-500/20",
        };
      case "Silver":
        return {
          bg: "bg-slate-800/30 border-slate-400/50 shadow-slate-400/10",
          text: "text-slate-300",
          badge: "bg-slate-400/10 border-slate-400/30 text-slate-300",
          glow: "shadow-slate-400/10",
        };
      default: // Bronze
        return {
          bg: "bg-orange-950/20 border-orange-700/40 shadow-orange-700/10",
          text: "text-orange-400",
          badge: "bg-orange-700/10 border-orange-700/30 text-orange-400",
          glow: "shadow-orange-700/10",
        };
    }
  };

  const theme = getRankTheme(user.rank);
  const aliasInitials = user.username ? user.username.slice(0, 2).toUpperCase() : "VS";

  return (
    <div className="flex flex-col gap-6">
      {/* Primary Card */}
      <div className={`relative overflow-hidden rounded-2xl border p-6 shadow-xl backdrop-blur-md transition-all duration-300 ${theme.bg} ${theme.glow}`}>
        <div className="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-linear-to-br from-blue-500/10 to-transparent blur-2xl" />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center border border-white/20 shadow-lg shadow-purple-500/20">
              <span className="text-2xl font-black italic text-white">{aliasInitials}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white leading-tight">
                {user.username}
              </h2>
              <div className="mt-1 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${theme.badge}`}>
                  <Shield className="h-3 w-3" />
                  {user.rank}
                </span>
                <span className="text-xs font-medium text-zinc-400">
                  {user.score} Rating Points (RP)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl shadow-inner backdrop-blur-sm">
            <Trophy className="h-5 w-5 text-amber-400 animate-pulse" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Match Rating
              </div>
              <div className="font-mono text-lg font-bold text-blue-400">
                {user.score}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-white/5 bg-white/5 p-3 backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
              Wins
            </div>
            <div className="mt-1 font-mono text-xl font-bold text-green-400">
              {user.wins}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/5 p-3 backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
              Losses
            </div>
            <div className="mt-1 font-mono text-xl font-bold text-rose-400">
              {user.losses}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/5 p-3 backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
              Draws
            </div>
            <div className="mt-1 font-mono text-xl font-bold text-zinc-300">
              {user.draws}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/5 p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                Win Rate
              </div>
              <Percent className="h-3 w-3 text-blue-400" />
            </div>
            <div className="mt-1 font-mono text-xl font-bold text-white">
              {winRate}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
