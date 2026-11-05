import { Calendar, Cookie, Search, Timer, Coffee, BookOpen, Clock, BarChart3 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();
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

  const currentPath = location.pathname;

  return (
    <nav className="fixed w-full z-[60] top-0 py-3 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto glass-panel rounded-full px-4 sm:px-6 py-2 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div
          onClick={() => handleNavigate("/")}
          className="flex items-center gap-2.5 cursor-pointer select-none py-0.5 shrink-0"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#29C5F6] to-[#3a4b9f] flex items-center justify-center shrink-0">
            <Cookie className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight text-white hidden sm:inline">Receitas</span>
        </div>

        {/* Center / Right: Navigation Items, Pomodoro Pill & Search */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Header Pomodoro Trigger Pill */}
          <button
            id="header-pomodoro-btn"
            type="button"
            onClick={toggleMinimized}
            className={cn(
              "cursor-hover flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-300 select-none cursor-pointer",
              !isMinimized
                ? "bg-white/15 text-white border-white/25 shadow-sm"
                : isRunning
                ? "bg-white/10 text-white border-white/20 hover:bg-white/15"
                : "bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10 hover:text-white"
            )}
            title={isRunning ? "Pomodoro em andamento (clique para abrir opções)" : "Abrir Pomodoro"}
          >
            {mode === "focus" ? (
              <Timer className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
            ) : (
              <Coffee className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
            )}
            <span className="font-mono tabular-nums text-xs font-medium text-white">
              {isOvertime ? `+${formatSeconds(overtimeSeconds)}` : formatSeconds(timeLeft)}
            </span>
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                isRunning ? "bg-emerald-400" : isOvertime ? "bg-white/80" : "bg-white/20"
              )}
            />
          </button>

          {/* Search Button */}
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="cursor-hover hidden md:flex items-center gap-1.5 text-xs font-medium text-white/75 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <span>Buscar</span>
            </button>
          )}

          {/* Navigation Links */}
          <button
            type="button"
            onClick={() => handleNavigate("/receitas")}
            className={cn(
              "cursor-hover text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer",
              currentPath === "/receitas" || currentPath === "/"
                ? "bg-white/15 text-white shadow-sm"
                : "text-white/75 hover:text-white hover:bg-white/5"
            )}
          >
            <BookOpen className="w-3.5 h-3.5 text-zinc-400 hidden sm:inline" />
            <span>Cursos</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate("/foco")}
            className={cn(
              "cursor-hover text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer",
              currentPath === "/foco"
                ? "bg-white/15 text-white shadow-sm"
                : "text-white/75 hover:text-white hover:bg-white/5"
            )}
          >
            <Clock className="w-3.5 h-3.5 text-zinc-400 hidden sm:inline" />
            <span>Foco</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate("/estatisticas")}
            className={cn(
              "cursor-hover text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer",
              currentPath === "/estatisticas"
                ? "bg-white/15 text-white shadow-sm"
                : "text-white/75 hover:text-white hover:bg-white/5"
            )}
          >
            <BarChart3 className="w-3.5 h-3.5 text-zinc-400 hidden sm:inline" />
            <span>Estatísticas</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate("/agenda")}
            className={cn(
              "cursor-hover text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer",
              currentPath === "/agenda"
                ? "bg-white/15 text-white shadow-sm"
                : "text-white/75 hover:text-white hover:bg-white/5"
            )}
          >
            <Calendar className="w-3.5 h-3.5 text-zinc-400 hidden sm:inline" />
            <span>Agenda</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate("/configuracoes")}
            className={cn(
              "cursor-hover text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-full transition-colors cursor-pointer",
              currentPath === "/configuracoes" || currentPath === "/settings"
                ? "bg-white/15 text-white shadow-sm"
                : "text-white/75 hover:text-white hover:bg-white/5"
            )}
          >
            Configurações
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Header;
