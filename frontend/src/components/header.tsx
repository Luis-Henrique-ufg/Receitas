import { Calendar, Utensils, Search, Coffee, BookOpen, Clock, BarChart3, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePomodoroStore } from "@/store/usePomodoroStore";
import { ModeToggle } from "@/components/mode-theme-toggle";
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
    <nav className="fixed w-full z-[60] top-0 py-3.5 px-4 sm:px-6">
      <div className="max-w-[1800px] mx-auto bg-card border border-border shadow-md rounded-full px-4 sm:px-6 py-2 flex items-center justify-between gap-4 transition-all">
        {/* Brand Logo with 15deg hover rotation */}
        <div
          onClick={() => handleNavigate("/receitas")}
          className="flex items-center gap-3 cursor-pointer select-none py-0.5 shrink-0 group"
        >
          <div className="w-9 h-9 rounded-full bg-primary text-[#030607] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:rotate-12 group-hover:scale-105">
            <Utensils className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="font-display font-semibold text-xl tracking-tight text-foreground leading-tight">Receitas</h1>
            <span className="text-[11px] text-muted-foreground block -mt-0.5 font-normal tracking-normal hidden sm:block">Plataforma de Cursos</span>
          </div>
        </div>

        {/* Center: Capsule Pill Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-card border border-border p-1 rounded-full shadow-inner">
          <button
            type="button"
            onClick={() => handleNavigate("/receitas")}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer",
              currentPath === "/receitas" || currentPath === "/"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Cursos</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate("/foco")}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer",
              currentPath === "/foco"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Foco</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate("/agenda")}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer",
              currentPath === "/agenda"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Agenda</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate("/estatisticas")}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer",
              currentPath === "/estatisticas"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Estatísticas</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate("/configuracoes")}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer",
              currentPath === "/configuracoes" || currentPath === "/settings"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Ajustes</span>
          </button>
        </nav>

        {/* Right: Pomodoro Pill, Search & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Header Pomodoro Trigger Pill */}
          <div
            id="header-pomodoro-btn"
            onClick={toggleMinimized}
            className={cn(
              "flex items-center gap-2.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all duration-200 select-none cursor-pointer shadow-sm bg-card border-border hover:border-primary",
              !isMinimized && "border-primary"
            )}
            title={isRunning ? "Pomodoro em andamento (clique para abrir opções)" : "Abrir Pomodoro"}
          >
            <span
              className={cn(
                "w-2 h-2 rounded-full shrink-0",
                isRunning ? "bg-primary animate-pulse-dot" : isOvertime ? "bg-accent" : "bg-muted-foreground/60"
              )}
            />
            {mode === "focus" ? (
              <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
            ) : (
              <Coffee className="w-3.5 h-3.5 text-accent shrink-0" />
            )}
            <span className="font-mono tabular-nums text-xs font-semibold text-foreground">
              {isOvertime ? `+${formatSeconds(overtimeSeconds)}` : formatSeconds(timeLeft)}
            </span>
          </div>

          {/* Search Button with Ctrl K */}
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="hidden lg:flex items-center gap-2 text-xs font-medium text-foreground bg-secondary/80 hover:bg-secondary border border-border px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Buscar...</span>
              <kbd className="text-[10px] font-mono opacity-60 bg-card px-1.5 py-0.5 rounded border border-border">Ctrl K</kbd>
            </button>
          )}

          {/* Theme Mode Switcher */}
          <div className="shrink-0">
            <ModeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Header;
