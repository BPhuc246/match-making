import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import type { AppDispatch, RootState } from "../store";
import { cancelQueue } from "../feature/queueThunk";

export default function QueueNotification() {
  const dispatch = useDispatch<AppDispatch>();
  const { isQueuing, queueMode, queueStartTime } = useSelector(
    (state: RootState) => state.global,
  );
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isQueuing || !queueStartTime) {
      setElapsedTime(0);
      return;
    }

    const updateTimer = () => {
      const elapsed = Math.max(
        0,
        Math.floor((Date.now() - queueStartTime) / 1000),
      );
      setElapsedTime(elapsed);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isQueuing, queueStartTime]);

  const handleCancel = () => {
    if (!queueMode) return;
    dispatch(cancelQueue(queueMode))
      .unwrap()
      .then(() => {
        toast.success("Matchmaking cancelled", {
          style: {
            background: "#0f172a",
            color: "#f8fafc",
            border: "1px solid #334155",
          },
        });
      })
      .catch(() => {
        toast.error("Failed to cancel matchmaking");
      });
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      {isQueuing && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border border-blue-500/50 bg-blue-600/20 px-4 py-2 shadow-lg shadow-blue-500/10 backdrop-blur-md"
        >
          {/* Glowing dot */}
          <div className="relative flex h-2.5 w-2.5 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500"></span>
          </div>

          <span className="text-xs font-mono tracking-widest text-blue-100 font-bold uppercase">
            SEARCHING ({queueMode})...
          </span>

          <span className="text-xs font-mono font-bold text-blue-400">
            {formatTime(elapsedTime)}
          </span>

          <button
            onClick={handleCancel}
            id="cancel-queue-button"
            className="ml-2 flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-rose-400 transition-all cursor-pointer"
            title="Cancel Matchmaking"
          >
            <X className="h-3 w-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
