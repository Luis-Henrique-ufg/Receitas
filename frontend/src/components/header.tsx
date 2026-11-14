import { Calendar, Cookie, Search, Timer, Coffee, BookOpen, Clock, BarChart3, Settings } from "lucide-react";
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
    <nav className="fixed w-full z-[60] top-0 py-3 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto bg-card/90 border border-border shadow-sm rounded-full px-4 sm:px-6 py-2 flex items-center justify-between gap-3 backdrop-blur-md transition-all">
        {/* Brand Logo */}
        <div
          onClick={() => handleNavigate("/")}
          className="flex items-center gap-2.5 cursor-pointer select-none py-0.5 shrink-0"
        >
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105">
            <Cookie className="w-4 h-4" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight text-foreground hidden sm:inline">Receitas</span>
        </div>

        {/* Center / Right: Navigation Items, Pomodoro Pill, Search & Theme Toggle */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Header Pomodoro Trigger Pill */}
          <button
            id="header-pomodoro-btn"
            type="button"
            onClick={toggleMinimized}
            className={cn(
              "flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-200 select-none cursor-pointer",
              !isMinimized
                ? "bg-primary/15 text-primary border-primary/30 shadow-sm font-semibold"
                : isRunning
                ? "bg-secondary text-foreground border-primary/40 hover:bg-secondary/90"
                : "bg-secondary/60 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
            )}
            title={isRunning ? "Pomodoro em andamento (clique para abrir opções)" : "Abrir Pomodoro"}
          >
            {mode === "focus" ? (
              <Timer className="w-3.5 h-3.5 text-primary shrink-0" />
            ) : (
              <Coffee className="w-3.5 h-3.5 text-accent shrink-0" />
            )}
            <span className="font-mono tabular-nums text-xs font-semibold text-foreground">
              {isOvertime ? `+${formatSeconds(overtimeSeconds)}` : formatSeconds(timeLeft)}
            </span>
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                isRunning ? "bg-primary animate-pulse" : isOvertime ? "bg-accent" : "bg-muted-foreground/40"
              )}
            />
          </button>

          {/* Search Button */}
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="hidden md:flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70 px-3 py-1.5 rounded-full transition-colors cursor-pointer border border-transparent"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Buscar</span>
            </button>
          )}

          {/* Navigation Links */}
          <button
            type="button"
            onClick={() => handleNavigate("/receitas")}
            className={cn(
              "text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer",
              currentPath === "/receitas" || currentPath === "/"
                ? "bg-primary/15 text-primary font-semibold border border-primary/25 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/70 border border-transparent"
            )}
          >
            <BookOpen className="w-3.5 h-3.5 hidden sm:inline" />
            <span>Cursos</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate("/foco")}
            className={cn(
              "text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer",
              currentPath === "/foco"
                ? "bg-primary/15 text-primary font-semibold border border-primary/25 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/70 border border-transparent"
            )}
          >
            <Clock className="w-3.5 h-3.5 hidden sm:inline" />
            <span>Foco</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate("/estatisticas")}
            className={cn(
              "text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer",
              currentPath === "/estatisticas"
                ? "bg-primary/15 text-primary font-semibold border border-primary/25 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/70 border border-transparent"
            )}
          >
            <BarChart3 className="w-3.5 h-3.5 hidden sm:inline" />
            <span>Estatísticas</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate("/agenda")}
            className={cn(
              "text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer",
              currentPath === "/agenda"
                ? "bg-primary/15 text-primary font-semibold border border-primary/25 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/70 border border-transparent"
            )}
          >
            <Calendar className="w-3.5 h-3.5 hidden sm:inline" />
            <span>Agenda</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate("/configuracoes")}
            className={cn(
              "text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5",
              currentPath === "/configuracoes" || currentPath === "/settings"
                ? "bg-primary/15 text-primary font-semibold border border-primary/25 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/70 border border-transparent"
            )}
            title="Configurações"
          >
            <Settings className="w-3.5 h-3.5 sm:hidden" />
            <span className="hidden sm:inline">Configurações</span>
          </button>

          {/* Theme Mode Switcher */}
          <div className="ml-1 shrink-0">
            <ModeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Header;
