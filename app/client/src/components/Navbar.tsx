import { Swords, LogOut, Trophy, User as UserIcon } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import type { AppDispatch, RootState } from "../store";
import { logout } from "../feature/authThunk";

export default function Navbar() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout())
      .unwrap()
      .then(() => {
        toast.success("Logged out successfully");
        navigate("/auth");
      });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#121214]/60 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 border border-white/20 shadow-lg shadow-purple-500/20">
            <Swords className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-sans font-black uppercase tracking-wider text-white text-md sm:text-lg">
              RPS <span className="text-blue-400 font-semibold">Arena</span>
            </span>
          </div>
        </Link>

        {/* User Info Bar */}
        {user ? (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5 text-blue-400" />
                {user.username}
              </span>
              <span className="text-[11px] font-mono font-medium text-zinc-400 flex items-center gap-1">
                <Trophy className="h-3 w-3 text-amber-400" />
                {user.rank} ({user.score} RP)
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              id="logout-button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-rose-400 transition-all cursor-pointer"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-600/20 transition-all"
          >
            Join Arena
          </Link>
        )}
      </div>
    </header>
  );
}
