import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Swords, ArrowRight, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import type { AppDispatch, RootState } from "../store";
import { fetch, login, register } from "../feature/authThunk";
import { clearError } from "../store/authSlice";

export default function AuthPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [isLoginTab, setIsLoginTab] = useState(true);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { status, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(fetch())
      .unwrap()
      .then((existingUser) => {
        if (existingUser) {
          navigate("/");
        }
      });

    return () => {
      dispatch(clearError());
    };
  }, [dispatch, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.email.trim() ||
      !formData.password.trim() ||
      (!formData.username.trim() && !isLoginTab)
    ) {
      toast.error("All fields are required");
      return;
    }

    if (
      (formData.username.trim().length < 4 ||
        formData.username.trim().length > 20) &&
      !isLoginTab
    ) {
      toast.error("Username length range from 4 to 20");
      return;
    }

    if (formData.password.trim().length < 6) {
      toast.error("Password length should be at least 6");
      return;
    }

    if (isLoginTab) {
      dispatch(
        login({
          email: formData.email,
          password: formData.password,
        }),
      )
        .unwrap()
        .then((loggedInUser) => {
          toast.success(
            `Welcome, ${loggedInUser.username}! Entered the arena.`,
            {
              style: {
                background: "#0f172a",
                color: "#f8fafc",
                border: "1px solid #334155",
              },
            },
          );

          navigate("/");
        });
    } else {
      dispatch(register(formData))
        .unwrap()
        .then((loggedInUser) => {
          toast.success(
            `Welcome, ${loggedInUser.username}! Entered the arena.`,
            {
              style: {
                background: "#0f172a",
                color: "#f8fafc",
                border: "1px solid #334155",
              },
            },
          );

          navigate("/");
        });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-[#0e1014] to-[#09090b] p-4 text-white relative overflow-hidden">
      {/* Visual Overlay Texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay z-0"
        style={{
          backgroundImage: `url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E')`,
        }}
      />
      <div className="absolute top-1/4 left-1/2 h-87.5 w-87.5 -translate-x-1/2 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 border border-white/20 shadow-lg shadow-purple-500/20">
            <Swords className="h-9 w-9 text-white" />
          </div>
          <h1 className="mt-6 text-3xl font-black uppercase tracking-wider text-white">
            RPS <span className="text-blue-400">ARENA</span>
          </h1>
          <p className="mt-2 text-xs text-zinc-400 max-w-xs leading-relaxed">
            Register your tactical combat identifier to queue up for real-time
            matches and rank climbs.
          </p>
        </div>

        {/* Form Container */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {!isLoginTab && (
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-bold uppercase tracking-wider text-zinc-400"
                >
                  Combat username / Alias
                </label>
                <div className="mt-2 relative">
                  <input
                    type="text"
                    id="username"
                    name="username"
                    maxLength={18}
                    placeholder="e.g. abcdef@gmail.com"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    disabled={status === "pending"}
                    className="w-full rounded-xl border border-white/10 bg-[#09090b]/80 px-4 py-3 text-sm font-semibold text-white placeholder-zinc-600 outline-none focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/10 transition-all disabled:opacity-50"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wider text-zinc-400"
              >
                Combat Email / Alias
              </label>
              <div className="mt-2 relative">
                <input
                  type="text"
                  id="email"
                  name="email"
                  maxLength={18}
                  placeholder="e.g. abcdef@gmail.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={status === "pending"}
                  className="w-full rounded-xl border border-white/10 bg-[#09090b]/80 px-4 py-3 text-sm font-semibold text-white placeholder-zinc-600 outline-none focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/10 transition-all disabled:opacity-50"
                  required
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-zinc-400"
              >
                Combat Password / Alias
              </label>
              <div className="mt-2 relative">
                <input
                  type="password"
                  id="password"
                  name="password"
                  maxLength={18}
                  placeholder="*********"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  disabled={status === "pending"}
                  className="w-full rounded-xl border border-white/10 bg-[#09090b]/80 px-4 py-3 text-sm font-semibold text-white placeholder-zinc-600 outline-none focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/10 transition-all disabled:opacity-50"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-semibold text-rose-400">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
              onClick={() => setIsLoginTab(!isLoginTab)}
            >
              {isLoginTab
                ? "You do not have an account"
                : "Already have an account"}
            </button>
            <button
              type="submit"
              id="enter-arena-button"
              disabled={status === "pending"}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {status === "pending" ? (
                "Logging in..."
              ) : (
                <>
                  Enter the Arena
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Extra game credit banner */}
        <div className="mt-6 text-center text-[10px] uppercase font-bold tracking-widest text-zinc-600">
          ● REAL-TIME MATCHMAKING LOBBIES ACTIVE ●
        </div>
      </motion.div>
    </div>
  );
}
