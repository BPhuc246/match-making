import { Calendar, Swords, Trophy, ShieldAlert } from "lucide-react";
import type { MatchHistory } from "../types/matchInterface";

interface MatchHistoryTableProps {
  matches: MatchHistory[];
}

export default function MatchHistoryTable({ matches }: MatchHistoryTableProps) {
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Recent";
    }
  };

  if (!matches || matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/20 p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
          <Swords className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-300">No Matches Yet</h3>
        <p className="mt-1 text-xs text-slate-500 max-w-sm">
          Enter the arena in Casual or Ranked matchmaking to start your Rock Paper Scissors career!
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-md">
      <div className="border-b border-white/5 bg-[#121214]/40 px-6 py-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-400" />
          Combat History
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              <th className="px-6 py-3.5">Result</th>
              <th className="px-6 py-3.5">Mode</th>
              <th className="px-6 py-3.5">Opponent</th>
              <th className="px-6 py-3.5 text-center">Score</th>
              <th className="px-6 py-3.5 text-right">LP Change</th>
              <th className="px-6 py-3.5 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-medium">
            {matches.map((match) => {
              const isWin = match.result === "win";
              const isDraw = match.result === "draw";

              return (
                <tr
                  key={match.id}
                  className="hover:bg-white/5 transition-colors text-sm text-zinc-300"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
                        isWin
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : isDraw
                            ? "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {isWin && <Trophy className="h-3 w-3" />}
                      {!isWin && !isDraw && <ShieldAlert className="h-3 w-3" />}
                      {match.result}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-xs font-bold uppercase tracking-wider">
                    <span
                      className={`px-1.5 py-0.5 rounded border ${
                        match.mode === "rank"
                          ? "bg-blue-600/20 text-blue-400 border-blue-500/30"
                          : "bg-white/5 text-zinc-400 border-white/10"
                      }`}
                    >
                      {match.mode}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">
                        {match.opponentName}
                      </span>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-center font-mono font-bold text-zinc-200">
                    {match.playerScore} - {match.opponentScore}
                  </td>

                  <td className={`whitespace-nowrap px-6 py-4 text-right font-mono font-bold ${
                    match.mode === "casual"
                      ? "text-zinc-500"
                      : isWin
                        ? "text-green-400"
                        : isDraw
                          ? "text-zinc-400"
                          : "text-rose-400"
                  }`}>
                    {match.mode === "casual"
                      ? "—"
                      : isWin
                        ? `+${match.scoreChange}`
                        : isDraw
                          ? `+${match.scoreChange}`
                          : `${match.scoreChange}`}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-right text-xs text-zinc-500 font-normal">
                    {formatDate(match.date)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}