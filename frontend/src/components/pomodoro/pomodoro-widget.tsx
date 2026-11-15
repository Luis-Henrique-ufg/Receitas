import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Play,
  Pause,
  Square,
  Coffee,
  RotateCcw,
  AlertTriangle,
  Timer,
  X,
  ArrowUpRight,
} from "lucide-react";
import { usePomodoroStore } from "@/store/usePomodoroStore";
import { subjectsApi } from "@/services/subjectsApi";
import { Subject } from "@/models/models";
import useApiUrl from "@/hooks/useApiUrl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatSeconds(totalSecs: number): string {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatClockTime(dateMs: number): string {
  const d = new Date(dateMs);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export default function PomodoroWidget() {
  const navigate = useNavigate();
  const { apiUrl } = useApiUrl();
  const {
    mode,
    timeLeft,
    isRunning,
    isOvertime,
    overtimeSeconds,
    isMinimized,
    durations,
    currentSubjectId,
    currentSubjectName,
    intention,
    idleStartedAt,
    start,
    pause,
    reset,
    setMode,
    tick,
    toggleMinimized,
    recordUserActivity,
    stopAndRecord,
  } = usePomodoroStore();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [inactivityModalData, setInactivityModalData] = useState<{
    idleSeconds: number;
    idleSince: string;
  } | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  // Outside click listener to close popover
  useEffect(() => {
    if (isMinimized) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest("[role='dialog']") ||
        target.closest("[data-radix-portal]") ||
        target.closest("[data-sonner-toaster]")
      ) {
        return;
      }
      const headerBtn = document.getElementById("header-pomodoro-btn");
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        headerBtn &&
        !headerBtn.contains(target)
      ) {
        toggleMinimized();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isMinimized, toggleMinimized]);

  // Load subjects
  useEffect(() => {
    void subjectsApi
      .getAll(apiUrl, false)
      .then((data) => setSubjects(data))
      .catch((err) => console.error("Erro ao carregar matérias:", err));
  }, [apiUrl]);

  // Global ticker interval
  useEffect(() => {
    const interval = setInterval(() => {
      tick(apiUrl);
    }, 1000);
    return () => clearInterval(interval);
  }, [tick, apiUrl]);

  // User activity listeners
  useEffect(() => {
    const handleActivity = () => {
      recordUserActivity();
    };

    window.addEventListener("mousemove", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });
    window.addEventListener("click", handleActivity, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
    };
  }, [recordUserActivity]);

  // Document Title update
  useEffect(() => {
    if (!isRunning && !isOvertime) {
      document.title = "Receitas";
      return;
    }
    const timeStr = isOvertime
      ? `+${formatSeconds(overtimeSeconds)}`
      : formatSeconds(timeLeft);
    const modeLabel =
      mode === "focus"
        ? isOvertime
          ? "Prolongamento"
          : "Foco"
        : "Intervalo";
    document.title = `${timeStr} · ${modeLabel} | Receitas`;

    return () => {
      document.title = "Receitas";
    };
  }, [isRunning, isOvertime, overtimeSeconds, timeLeft, mode]);

  const activeSubject = subjects.find((s) => s.id === currentSubjectId);
  const subjectDisplayColor = activeSubject ? activeSubject.color : "#64748b";
  const subjectDisplayName = activeSubject
    ? activeSubject.name
    : currentSubjectName || "Sem matéria";

  // Stop session
  const handleStopSession = () => {
    if (idleStartedAt && isOvertime) {
      const idleSecs = Math.floor((Date.now() - idleStartedAt) / 1000);
      if (idleSecs >= 300) {
        setInactivityModalData({
          idleSeconds: idleSecs,
          idleSince: formatClockTime(idleStartedAt),
        });
        return;
      }
    }
    void stopAndRecord(apiUrl);
  };

  const handleConfirmInactivityDiscount = (discount: boolean) => {
    const discountSecs =
      discount && inactivityModalData ? inactivityModalData.idleSeconds : 0;
    setInactivityModalData(null);
    void stopAndRecord(apiUrl, discountSecs);
  };

  const handleStartBreak = () => {
    void stopAndRecord(apiUrl).then(() => {
      setMode("short_break");
      start();
    });
  };

  const handleOpenFocusScreen = () => {
    toggleMinimized();
    navigate("/foco");
  };

  const totalDuration = durations[mode] * 60;
  const progressPercent = isOvertime
    ? 100
    : totalDuration > 0
    ? Math.min(100, Math.max(0, ((totalDuration - timeLeft) / totalDuration) * 100))
    : 0;

  const widgetContent = (
    <>
      {/* Suspended Mini HUD Popover Panel */}
      {!isMinimized && (
        <div
          ref={panelRef}
          style={{
            position: "fixed",
            top: "4.5rem",
            right: "1.5rem",
            zIndex: 9990,
          }}
          className="w-[calc(100vw-2rem)] max-w-[280px] rounded-3xl border border-border bg-card text-foreground p-4 shadow-2xl select-none animate-in fade-in slide-in-from-top-3 duration-200"
        >
          {/* Header Status & Close */}
          <div className="flex items-center justify-between pb-2.5 border-b border-border">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  isRunning
                    ? "bg-primary animate-pulse-dot"
                    : isOvertime
                    ? "bg-accent animate-pulse"
                    : "bg-muted-foreground/40"
                )}
              />
              <span className="text-xs font-semibold text-foreground">
                {mode === "focus"
                  ? isOvertime
                    ? "Prolongamento"
                    : "Foco"
                  : "Intervalo"}
              </span>
            </div>

            <button
              type="button"
              onClick={toggleMinimized}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-muted/50 h-1.5 rounded-full overflow-hidden mt-3 mb-3">
            <div
              className={cn(
                "h-full transition-all duration-500 bg-primary",
                isOvertime && "animate-pulse"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Big Time Display */}
          <div className="text-center py-1">
            <div className="text-4xl font-mono font-bold tracking-tight text-foreground tabular-nums select-none">
              {isOvertime
                ? `+${formatSeconds(overtimeSeconds)}`
                : formatSeconds(timeLeft)}
            </div>

            {/* Subject badge */}
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/60 border border-border text-[11px] text-foreground/85 max-w-[220px] truncate">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: subjectDisplayColor }}
              />
              <span className="truncate">{subjectDisplayName}</span>
            </div>

            {intention && (
              <p className="text-[11px] text-muted-foreground italic mt-1 truncate">
                &quot;{intention}&quot;
              </p>
            )}
          </div>

          {/* Action Controls: Symmetrical, equal heights, zero jiggle */}
          <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-border">
            {/* Left Slot: Stop (if active) or Reset (if idle) */}
            {isRunning || isOvertime ? (
              <Button
                variant="outline"
                size="icon"
                onClick={handleStopSession}
                className="h-9 w-9 rounded-xl border-border bg-secondary/50 hover:bg-secondary text-xs text-foreground shrink-0 cursor-pointer"
                title="Parar e Gravar"
              >
                <Square className="w-3.5 h-3.5 fill-current text-destructive" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="icon"
                onClick={reset}
                className="h-9 w-9 rounded-xl border-border bg-secondary/50 hover:bg-secondary text-xs text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                title="Reiniciar"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            )}

            {/* Center Slot: Play / Pause */}
            <Button
              size="sm"
              onClick={isRunning ? pause : start}
              className="flex-1 h-9 rounded-full bg-primary hover:brightness-105 text-[#030607] font-semibold text-xs gap-1.5 transition-all cursor-pointer flex items-center justify-center shadow-sm"
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current shrink-0" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                  <span>Iniciar</span>
                </>
              )}
            </Button>

            {/* Right Slot: Break / Focus Switch */}
            {mode === "focus" ? (
              <Button
                variant="outline"
                size="icon"
                onClick={handleStartBreak}
                className="h-9 w-9 rounded-xl border-border bg-secondary/50 hover:bg-secondary text-xs text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                title="Fazer Intervalo de Descanso"
              >
                <Coffee className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMode("focus")}
                className="h-9 w-9 rounded-xl border-border bg-secondary/50 hover:bg-secondary text-xs text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                title="Voltar ao Foco"
              >
                <Timer className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {/* Footer link to dedicated Focus screen */}
          <button
            type="button"
            onClick={handleOpenFocusScreen}
            className="w-full mt-3 pt-2.5 border-t border-border text-xs text-primary hover:brightness-110 flex items-center justify-center gap-1 font-semibold transition-colors cursor-pointer"
          >
            <span>Abrir tela de Foco</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Inactivity Modal Dialog */}
      <Dialog
        open={Boolean(inactivityModalData)}
        onOpenChange={(open) => {
          if (!open) handleConfirmInactivityDiscount(false);
        }}
      >
        <DialogContent className="max-w-md bg-card border-border text-foreground rounded-3xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-display font-semibold">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Inatividade Detectada
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Detectamos que você esteve inativo por{" "}
              {inactivityModalData
                ? Math.round(inactivityModalData.idleSeconds / 60)
                : 0}{" "}
              minutos desde às {inactivityModalData?.idleSince}. Deseja descontar
              esse período da sua sessão de foco?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleConfirmInactivityDiscount(false)}
              className="text-xs border-border bg-secondary/50 text-foreground hover:bg-secondary rounded-full"
            >
              Manter Tempo Total
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleConfirmInactivityDiscount(true)}
              className="text-xs bg-primary hover:brightness-105 text-[#030607] font-semibold rounded-full shadow-sm"
            >
              Descontar Inatividade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  return typeof document !== "undefined"
    ? createPortal(widgetContent, document.body)
    : null;
}
