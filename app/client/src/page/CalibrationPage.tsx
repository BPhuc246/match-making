import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertOctagon, RefreshCw, Activity } from "lucide-react";
import type { AppDispatch, RootState } from "../store";
import { fetchCalibration } from "../feature/adminThunk";

export default function CalibrationPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { calibration, status, error } = useSelector((state: RootState) => state.admin);

  useEffect(() => {
    dispatch(fetchCalibration());
  }, [dispatch]);

  if (status === "loading" && !calibration) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="h-8 w-8 text-blue-400 animate-spin" />
        <span className="text-xs uppercase tracking-widest text-zinc-400">Loading calibration data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertOctagon className="h-10 w-10 text-rose-500" />
        <p className="text-sm text-zinc-400">{error}</p>
      </div>
    );
  }

  if (!calibration || calibration.buckets.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <Activity className="h-10 w-10 text-zinc-500" />
        <p className="text-sm text-zinc-400">
          No completed RANKED matches yet — calibration data will appear here once matches finish.
        </p>
      </div>
    );
  }

  const chartData = calibration.buckets.map((b) => ({
    name: `${(b.bucket * 10)}-${(b.bucket + 1) * 10}%`,
    predicted: Math.round(b.avgPredictedWinProb * 100),
    actual: Math.round(b.actualWinRate * 100),
    matches: b.matchCount,
  }));

  const errorLevel =
    calibration.meanAbsoluteCalibrationError < 0.05
      ? { label: "Well calibrated", color: "text-green-400" }
      : calibration.meanAbsoluteCalibrationError < 0.15
        ? { label: "Reasonably calibrated", color: "text-amber-400" }
        : { label: "Poorly calibrated", color: "text-rose-400" };

  return (
    <div className="flex-1 flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-wider text-white">
          Matchmaking Calibration
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Compares predicted win probability (Glicko-2) against actual outcomes, bucketed by predicted confidence.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-xs text-zinc-400 uppercase tracking-wider">Total Ranked Matches</div>
          <div className="text-3xl font-mono font-black text-white mt-1">
            {calibration.totalRankedMatches}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-xs text-zinc-400 uppercase tracking-wider">Mean Calibration Error</div>
          <div className="text-3xl font-mono font-black text-white mt-1">
            {(calibration.meanAbsoluteCalibrationError * 100).toFixed(1)}%
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-xs text-zinc-400 uppercase tracking-wider">Status</div>
          <div className={`text-lg font-black mt-1 ${errorLevel.color}`}>{errorLevel.label}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300 mb-4">
          Predicted vs Actual Win Rate by Bucket
        </h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
            <YAxis stroke="#71717a" fontSize={11} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ background: "#09090b", border: "1px solid #ffffff20", borderRadius: 8 }}
              labelStyle={{ color: "#fff" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="predicted" name="Predicted Win %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" name="Actual Win %" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-zinc-500 mt-3">
          Bars close together across all buckets = well-calibrated predictions. Consistent gaps suggest the
          rating system is systematically over- or under-confident.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full text-left text-xs">
          <thead className="bg-white/5 text-zinc-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Bucket</th>
              <th className="px-4 py-3">Matches</th>
              <th className="px-4 py-3">Predicted Win %</th>
              <th className="px-4 py-3">Actual Win %</th>
              <th className="px-4 py-3">Avg Unfairness</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-zinc-300">
            {calibration.buckets.map((b) => (
              <tr key={b.bucket}>
                <td className="px-4 py-3">{b.bucket * 10}-{(b.bucket + 1) * 10}%</td>
                <td className="px-4 py-3 font-mono">{b.matchCount}</td>
                <td className="px-4 py-3 font-mono">{(b.avgPredictedWinProb * 100).toFixed(1)}%</td>
                <td className="px-4 py-3 font-mono">{(b.actualWinRate * 100).toFixed(1)}%</td>
                <td className="px-4 py-3 font-mono">{b.avgUnfairness.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}