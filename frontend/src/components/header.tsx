import { Calendar, Cookie, Search, Timer, Coffee, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePomodoroStore } from "@/store/usePomodoroStore";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onOpenSearch?: () => void;
}

function formatSeconds(totalSecs: number): string {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function Header({ onOpenSearch }: HeaderProps) {
  const navigate = useNavigate();
  const {
    mode,
    timeLeft,
    isRunning,
    isOvertime,
    overtimeSeconds,
    isMinimized,
    toggleMinimized,
  } = usePomodoroStore();

  function handleNavigate(path: string) {
    navigate(path);
  }

  return (
    <nav className="fixed w-full z-[60] top-0 transition-all duration-300 py-3 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto glass-panel rounded-full px-5 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Brand Logo - pure typography + gradient icon */}
        <div
          onClick={() => handleNavigate("/")}
          className="cursor-hover group flex items-center gap-2.5 cursor-pointer select-none py-0.5"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#29C5F6] to-[#3a4b9f] flex items-center justify-center shadow-[0_4px_10px_rgba(41,197,246,0.3)] group-hover:scale-105 transition-transform duration-300">
            <Cookie className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight text-white">Receitas</span>
        </div>

        {/* Navigation Items, Pomodoro & Search */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Header Pomodoro Trigger Pill */}
          <button
            id="header-pomodoro-btn"
            type="button"
            onClick={toggleMinimized}
            className={cn(
              "cursor-hover flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-300 select-none",
              !isMinimized
                ? "bg-white/15 text-white border-white/25 shadow-sm"
                : isRunning
                ? "bg-white/10 text-white border-white/20 hover:bg-white/15"
                : "bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10 hover:text-white"
            )}
            title={isRunning ? "Pomodoro em andamento (clique para abrir opções)" : "Abrir Pomodoro"}
          >
            {mode === "focus" ? (
              isOvertime ? (
                <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              ) : (
                <Timer className="w-3.5 h-3.5 text-[#007bff] shrink-0" />
              )
            ) : (
              <Coffee className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            )}
            <span className="font-mono tabular-nums text-xs font-medium text-white">
              {isOvertime ? `+${formatSeconds(overtimeSeconds)}` : formatSeconds(timeLeft)}
            </span>
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                isRunning ? "bg-emerald-400" : isOvertime ? "bg-cyan-400" : "bg-white/20"
              )}
            />
          </button>

          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="cursor-hover hidden sm:flex items-center gap-2 text-xs font-medium text-white/75 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-full transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <span>Buscar</span>
            </button>
          )}

          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="cursor-hover sm:hidden w-8 h-8 rounded-full flex items-center justify-center text-white/75 hover:text-white hover:bg-white/5 transition-colors"
              title="Buscar"
            >
              <Search className="w-4 h-4 text-zinc-300" />
            </button>
          )}

          <button
            type="button"
            onClick={() => handleNavigate("/agenda")}
            className="cursor-hover text-xs font-medium text-white/75 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>Agenda</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate("/configuracoes")}
            className="cursor-hover text-xs font-medium text-white/75 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-full transition-colors"
          >
            Configurações
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Header;
