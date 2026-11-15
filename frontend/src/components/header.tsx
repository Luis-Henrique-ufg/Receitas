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

  const navItems = [
    { path: "/receitas", matchPaths: ["/receitas", "/"], label: "Cursos", icon: BookOpen },
    { path: "/foco", matchPaths: ["/foco"], label: "Foco", icon: Clock },
    { path: "/agenda", matchPaths: ["/agenda"], label: "Agenda", icon: Calendar },
    { path: "/estatisticas", matchPaths: ["/estatisticas"], label: "Estatísticas", icon: BarChart3 },
    { path: "/configuracoes", matchPaths: ["/configuracoes", "/settings"], label: "Ajustes", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-background/90 backdrop-blur-md border-b border-border transition-colors duration-300">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[68px] flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div
          onClick={() => handleNavigate("/receitas")}
          className="flex items-center gap-3 cursor-pointer select-none shrink-0 group"
        >
          <div className="w-9 h-9 rounded-full bg-primary text-[#030607] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:rotate-[15deg] group-hover:scale-105">
            <Utensils className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-display font-semibold text-[21px] sm:text-[22px] tracking-[-0.02em] text-foreground leading-none">
              Receitas
            </h1>
            <span className="text-[11.5px] text-muted-foreground font-normal leading-tight mt-0.5 hidden sm:block">
              Plataforma de Cursos
            </span>
          </div>
        </div>

        {/* Center: Clean Segmented Capsule Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-secondary/75 dark:bg-card border border-border p-1 rounded-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.matchPaths.includes(currentPath);
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNavigate(item.path)}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-full text-[13.5px] font-medium transition-all duration-200 cursor-pointer",
                  isActive
                    ? "bg-card dark:bg-secondary text-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50 dark:hover:bg-secondary/50"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-current")} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Pomodoro Pill, Search & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Header Pomodoro Trigger Pill */}
          <div
            id="header-pomodoro-btn"
            onClick={toggleMinimized}
            className={cn(
              "flex items-center gap-2 text-[13.5px] font-semibold px-3.5 py-1.5 h-9 rounded-full border transition-all duration-200 select-none cursor-pointer shadow-sm bg-card border-border hover:border-primary",
              !isMinimized && "border-primary ring-2 ring-primary/15"
            )}
            title={isRunning ? "Pomodoro em andamento (clique para abrir opções)" : "Abrir Pomodoro"}
          >
            <span
              className={cn(
                "w-2 h-2 rounded-full shrink-0",
                isRunning ? "bg-primary animate-pulse-dot" : isOvertime ? "bg-accent" : "bg-muted-foreground/50"
              )}
            />
            {mode === "focus" ? (
              <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
            ) : (
              <Coffee className="w-3.5 h-3.5 text-accent shrink-0" />
            )}
            <span className="font-display tabular-nums text-[13.5px] font-semibold text-foreground">
              {isOvertime ? `+${formatSeconds(overtimeSeconds)}` : formatSeconds(timeLeft)}
            </span>
          </div>

          {/* Search Button with Ctrl K */}
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="hidden lg:flex items-center gap-2 text-[13px] font-medium text-muted-foreground hover:text-foreground bg-card hover:bg-secondary/70 border border-border px-3.5 h-9 rounded-full transition-colors cursor-pointer shadow-sm"
            >
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Buscar...</span>
              <kbd className="text-[10.5px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">
                Ctrl K
              </kbd>
            </button>
          )}

          {/* Theme Mode Switcher */}
          <div className="shrink-0">
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
