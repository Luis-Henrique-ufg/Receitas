import { useEffect, useState, useCallback, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  ChevronDown,
  Maximize2,
  Settings2,
  Check,
  BookOpen,
  Square,
  Coffee,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { usePomodoroStore, PomodoroMode } from "@/store/usePomodoroStore";
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
  const { apiUrl } = useApiUrl();
  const {
    mode,
    timeLeft,
    isRunning,
    isOvertime,
    overtimeSeconds,
    sessionsCompleted,
    isMinimized,
    soundEnabled,
    durations,
    currentSubjectId,
    currentSubjectName,
    idleStartedAt,
    sessionSummary,
    start,
    pause,
    reset,
    skip,
    setMode,
    tick,
    toggleMinimized,
    toggleSound,
    updateDurations,
    setCurrentSubject,
    recordUserActivity,
    stopAndRecord,
    dismissSummary,
  } = usePomodoroStore();

  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [customFocus, setCustomFocus] = useState(durations.focus);
  const [customBreak, setCustomBreak] = useState(durations.short_break);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);

  // Inactivity confirmation dialog state
  const [inactivityModalData, setInactivityModalData] = useState<{
    idleSeconds: number;
    idleSince: string;
  } | null>(null);

  const originalTitleRef = useRef<string>("Receitas");

  // Keep track of original title
  useEffect(() => {
    if (typeof document !== "undefined") {
      originalTitleRef.current = document.title || "Receitas";
    }
  }, []);

  // Update document title dynamically
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (!isRunning) {
      document.title = originalTitleRef.current;
      return;
    }

    if (mode === "focus") {
      if (isOvertime) {
        document.title = `(+${formatSeconds(overtimeSeconds)}) 🍅 Receitas (Prolongamento)`;
      } else {
        document.title = `(${formatSeconds(timeLeft)}) 🍅 Receitas`;
      }
    } else {
      document.title = `(${formatSeconds(timeLeft)}) ☕ Pausa · Receitas`;
    }

    return () => {
      document.title = originalTitleRef.current;
    };
  }, [isRunning, mode, isOvertime, overtimeSeconds, timeLeft]);

  // Request browser Notification permission if supported
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        void Notification.requestPermission();
      }
    }
  }, []);

  // Activity listeners to track real interaction
  useEffect(() => {
    const handleActivity = () => {
      recordUserActivity();
    };

    window.addEventListener("mousemove", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });
    window.addEventListener("click", handleActivity, { passive: true });
    window.addEventListener("touchstart", handleActivity, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
    };
  }, [recordUserActivity]);

  // Load active subjects for selection
  const loadSubjects = useCallback(async () => {
    try {
      const data = await subjectsApi.getAll(apiUrl, false);
      setSubjects(data);
    } catch {
      // benign error if offline
    }
  }, [apiUrl]);

  useEffect(() => {
    loadSubjects();

    const handleSubjectsUpdated = () => {
      void loadSubjects();
    };

    window.addEventListener("subjectsUpdated", handleSubjectsUpdated);
    return () => {
      window.removeEventListener("subjectsUpdated", handleSubjectsUpdated);
    };
  }, [loadSubjects]);

  // Timer heartbeat
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        tick(apiUrl);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, tick, apiUrl]);

  const modeLabels: Record<
    PomodoroMode,
    { label: string; icon: string; color: string }
  > = {
    focus: {
      label: isOvertime ? "Prolongamento" : "Foco",
      icon: isOvertime ? "⚡" : "🍅",
      color: isOvertime
        ? "from-cyan-400 to-emerald-500"
        : "from-rose-500 to-red-600",
    },
    short_break: {
      label: "Pausa Curta",
      icon: "☕",
      color: "from-amber-500 to-emerald-600",
    },
    long_break: {
      label: "Pausa Longa",
      icon: "🌴",
      color: "from-sky-500 to-indigo-600",
    },
  };

  const currentModeInfo = modeLabels[mode];

  const totalCurrentSeconds = durations[mode] * 60;
  const progressPercent = isOvertime
    ? 100
    : Math.max(
        0,
        Math.min(
          100,
          ((totalCurrentSeconds - timeLeft) / totalCurrentSeconds) * 100
        )
      );

  function handleSaveSettings() {
    updateDurations({
      focus: Math.max(1, customFocus),
      short_break: Math.max(1, customBreak),
    });
    setIsEditingSettings(false);
  }

  // Active subject metadata
  const activeSubject = subjects.find((s) => s.id === currentSubjectId);
  const subjectDisplayColor = activeSubject ? activeSubject.color : "#64748b";
  const subjectDisplayName = activeSubject
    ? activeSubject.name
    : currentSubjectName || "Sem matéria";

  // Stop button handler: checks for inactivity / ghost time
  function handleStopSession() {
    if (idleStartedAt && isOvertime) {
      const idleSecs = Math.floor((Date.now() - idleStartedAt) / 1000);
      if (idleSecs >= 300) {
        // More than 5 min idle detected
        setInactivityModalData({
          idleSeconds: idleSecs,
          idleSince: formatClockTime(idleStartedAt),
        });
        return;
      }
    }
    // Standard stop
    void stopAndRecord(apiUrl);
  }

  function handleConfirmInactivityDiscount(discount: boolean) {
    const discountSecs =
      discount && inactivityModalData ? inactivityModalData.idleSeconds : 0;
    setInactivityModalData(null);
    void stopAndRecord(apiUrl, discountSecs);
  }

  // Handle switching to break directly from focus
  function handleTransitionToBreak() {
    void stopAndRecord(apiUrl).then(() => {
      setMode("short_break");
      start();
    });
  }

  if (isMinimized) {
    return (
      <>
        <div
          onClick={toggleMinimized}
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            zIndex: 70,
          }}
          title={
            currentSubjectId
              ? `Matéria: ${subjectDisplayName}`
              : isOvertime
              ? "Modo Prolongamento"
              : "Pomodoro"
          }
          className={cn(
            "flex items-center gap-2.5 px-4 py-2 rounded-full glass-panel glass-panel-hover border shadow-2xl cursor-pointer select-none transition-all duration-300 hover:scale-105 backdrop-blur-xl",
            isOvertime
              ? "border-cyan-400/50 bg-[#06182c]/95 ring-2 ring-cyan-500/30"
              : "border-white/20 bg-[#050a14]/90"
          )}
        >
          <span className="text-lg">{currentModeInfo.icon}</span>
          <span
            className={cn(
              "font-mono font-bold text-sm tracking-wider tabular-nums",
              isOvertime ? "text-cyan-300" : "text-white"
            )}
          >
            {isOvertime
              ? `+${formatSeconds(overtimeSeconds)}`
              : formatSeconds(timeLeft)}
          </span>
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              backgroundColor: isRunning ? "#10b981" : subjectDisplayColor,
            }}
          />
          <Maximize2 className="w-3.5 h-3.5 text-zinc-400 hover:text-white ml-1" />
        </div>

        {/* Inactivity Modal if triggered while minimized */}
        {inactivityModalData && (
          <Dialog
            open={!!inactivityModalData}
            onOpenChange={() => setInactivityModalData(null)}
          >
            <DialogContent className="max-w-md bg-[#0a0f1d] border-white/15 text-white">
              <DialogHeader>
                <DialogTitle className="text-base font-heading font-bold flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                  Inatividade Detectada
                </DialogTitle>
                <DialogDescription className="text-zinc-300 text-xs pt-1 leading-relaxed">
                  Você ficou sem interação e sem vídeo tocando desde as{" "}
                  <strong className="text-white">
                    {inactivityModalData.idleSince}
                  </strong>{" "}
                  (cerca de{" "}
                  {Math.round(inactivityModalData.idleSeconds / 60)} minutos).
                  Deseja descontar esse tempo para manter suas estatísticas
                  precisas?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-white/10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleConfirmInactivityDiscount(false)}
                  className="text-xs"
                >
                  Manter tempo integral
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleConfirmInactivityDiscount(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
                >
                  Descontar {Math.round(inactivityModalData.idleSeconds / 60)}{" "}
                  min
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  }

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 70,
        }}
        className={cn(
          "w-80 rounded-2xl glass-panel border p-4 shadow-2xl backdrop-blur-2xl select-none animate-in fade-in slide-in-from-bottom-4 duration-200 transition-colors",
          isOvertime
            ? "border-cyan-400/40 bg-[#06182c]/95 shadow-[0_0_25px_rgba(6,182,212,0.15)]"
            : "border-white/20 bg-[#050a14]/95"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-lg">
            {(["focus", "short_break", "long_break"] as PomodoroMode[]).map(
              (m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                    mode === m
                      ? isOvertime && m === "focus"
                        ? "bg-cyan-500/30 text-cyan-200 shadow-sm font-semibold border border-cyan-400/40"
                        : "bg-white/20 text-white shadow-sm font-semibold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                  )}
                >
                  {m === "focus" && isOvertime
                    ? "Prolongamento"
                    : modeLabels[m].label}
                </button>
              )
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleSound}
              title={soundEnabled ? "Som Ativado" : "Som Desativado"}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4 text-zinc-500" />
              )}
            </button>
            <button
              onClick={() => setIsEditingSettings(!isEditingSettings)}
              title="Configurações de Tempo"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <button
              onClick={toggleMinimized}
              title="Minimizar Widget"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isEditingSettings ? (
          <div className="py-4 space-y-3">
            <div className="text-xs font-semibold text-zinc-300">
              Duração dos Ciclos (minutos)
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Foco:</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={customFocus}
                  onChange={(e) => setCustomFocus(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Pausa Curta:</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={customBreak}
                  onChange={(e) => setCustomBreak(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditingSettings(false)}
                className="text-xs h-8"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveSettings}
                className="text-xs h-8 bg-blue-600 hover:bg-blue-500 text-white gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Salvar
              </Button>
            </div>
          </div>
        ) : (
          /* Main Timer Body */
          <div className="py-4 flex flex-col items-center">
            {/* Progress bar / pulse */}
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-4 relative">
              <div
                className={cn(
                  "h-full transition-all duration-500 bg-gradient-to-r",
                  currentModeInfo.color,
                  isOvertime && "animate-pulse"
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Main Clock */}
            <div
              className={cn(
                "text-5xl font-mono font-black tracking-tight mb-2 drop-shadow-md tabular-nums transition-colors",
                isOvertime ? "text-cyan-300" : "text-white"
              )}
            >
              {isOvertime
                ? `+${formatSeconds(overtimeSeconds)}`
                : formatSeconds(timeLeft)}
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-3">
              {isOvertime ? (
                <span className="text-cyan-400 font-medium flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Foco cumprido · Em
                  prolongamento
                </span>
              ) : (
                <>
                  <span>
                    {currentModeInfo.icon} {currentModeInfo.label}
                  </span>
                  <span>•</span>
                  <span>
                    {sessionsCompleted}{" "}
                    {sessionsCompleted === 1
                      ? "ciclo concluído"
                      : "ciclos concluídos"}
                  </span>
                </>
              )}
            </div>

            {/* Subject Selector dropdown */}
            <div className="w-full relative mb-4">
              <button
                type="button"
                onClick={() =>
                  setIsSubjectDropdownOpen(!isSubjectDropdownOpen)
                }
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-zinc-200 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: subjectDisplayColor }}
                  />
                  <span className="truncate">{subjectDisplayName}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 ml-1.5" />
              </button>

              {isSubjectDropdownOpen && (
                <div className="absolute bottom-full mb-1 left-0 right-0 bg-[#0c1222] border border-white/20 rounded-xl shadow-2xl p-1 z-30 max-h-48 overflow-y-auto space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentSubject(null, null);
                      setIsSubjectDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors",
                      currentSubjectId === null
                        ? "bg-blue-600/30 text-white font-medium"
                        : "text-zinc-300 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-2 h-2 rounded-full bg-zinc-500" />
                      <span>Sem matéria</span>
                    </div>
                    {currentSubjectId === null && (
                      <Check className="w-3.5 h-3.5 text-blue-400" />
                    )}
                  </button>

                  {subjects.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        setCurrentSubject(sub.id, sub.name);
                        setIsSubjectDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors",
                        currentSubjectId === sub.id
                          ? "bg-blue-600/30 text-white font-medium"
                          : "text-zinc-300 hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: sub.color }}
                        />
                        <span className="truncate">{sub.name}</span>
                      </div>
                      {currentSubjectId === sub.id && (
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                      )}
                    </button>
                  ))}

                  {subjects.length === 0 && (
                    <div className="p-2 text-center text-[11px] text-zinc-500">
                      <BookOpen className="w-3.5 h-3.5 mx-auto mb-1 opacity-60" />
                      Cadastre matérias em Configurações
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons: Parar | Play/Pause | Pausa/Skip */}
            <div className="flex items-center justify-center gap-2.5 w-full">
              {/* Parar / Encerrar Sessão button (Available during focus or overtime) */}
              {mode === "focus" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStopSession}
                  title="Parar e Gravar Sessão"
                  className="h-9 px-3 rounded-xl border-white/15 bg-white/5 hover:bg-white/10 text-xs text-zinc-200 hover:text-white gap-1.5"
                >
                  <Square className="w-3.5 h-3.5 fill-current text-rose-400" />
                  <span>Parar</span>
                </Button>
              )}

              {/* Play / Pause Primary Button */}
              <Button
                onClick={isRunning ? pause : start}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95",
                  isOvertime
                    ? "bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 shadow-cyan-500/25"
                    : isRunning
                    ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/25"
                    : "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-500/25"
                )}
              >
                {isRunning ? (
                  <Pause className="w-5 h-5 fill-white" />
                ) : (
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                )}
              </Button>

              {/* Pausa / Pular Ciclo button */}
              {mode === "focus" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTransitionToBreak}
                  title="Fazer Pausa"
                  className="h-9 px-3 rounded-xl border-white/15 bg-white/5 hover:bg-white/10 text-xs text-zinc-200 hover:text-white gap-1.5"
                >
                  <Coffee className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pausa</span>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => skip(apiUrl)}
                  title="Pular Pausa"
                  className="w-9 h-9 rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              )}

              {/* Reset if not running */}
              {!isRunning && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={reset}
                  title="Reiniciar Ciclo"
                  className="w-8 h-8 rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Inactivity (Ghost Time) Confirmation Dialog */}
      {inactivityModalData && (
        <Dialog
          open={!!inactivityModalData}
          onOpenChange={() => setInactivityModalData(null)}
        >
          <DialogContent className="max-w-md bg-[#0a0f1d] border-white/15 text-white">
            <DialogHeader>
              <DialogTitle className="text-base font-heading font-bold flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                Inatividade Detectada
              </DialogTitle>
              <DialogDescription className="text-zinc-300 text-xs pt-1 leading-relaxed">
                Você ficou sem interação e sem reprodução de vídeo desde as{" "}
                <strong className="text-white">
                  {inactivityModalData.idleSince}
                </strong>{" "}
                (cerca de {Math.round(inactivityModalData.idleSeconds / 60)}{" "}
                minutos). Deseja descontar esse tempo para manter suas métricas
                precisas?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-white/10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConfirmInactivityDiscount(false)}
                className="text-xs"
              >
                Manter tempo integral
              </Button>
              <Button
                size="sm"
                onClick={() => handleConfirmInactivityDiscount(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
              >
                Descontar {Math.round(inactivityModalData.idleSeconds / 60)} min
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Post-Session Summary Celebratory Modal */}
      {sessionSummary && (
        <Dialog open={!!sessionSummary} onOpenChange={dismissSummary}>
          <DialogContent className="max-w-sm bg-[#090d16] border-white/15 text-white text-center">
            <DialogHeader className="items-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
                <Sparkles className="w-6 h-6" />
              </div>
              <DialogTitle className="text-lg font-heading font-bold text-white">
                Foco Concluído!
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-xs">
                Excelente sessão de estudos registrada com sucesso.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-2.5">
              <div className="text-3xl font-mono font-bold text-cyan-300 tabular-nums">
                {sessionSummary.durationMinutes} min
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-zinc-300">
                <span className="bg-white/10 px-2 py-0.5 rounded-full font-medium">
                  {sessionSummary.pomodorosCount}{" "}
                  {sessionSummary.pomodorosCount === 1
                    ? "pomodoro"
                    : "pomodoros"}
                </span>
                <span>•</span>
                <span className="font-medium text-white">
                  {sessionSummary.subjectName}
                </span>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t border-white/10">
              <Button
                variant="outline"
                size="sm"
                onClick={dismissSummary}
                className="w-full sm:w-auto text-xs"
              >
                Fechar
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  dismissSummary();
                  setMode("short_break");
                  start();
                }}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1.5"
              >
                <Coffee className="w-3.5 h-3.5" /> Fazer Pausa (5 min)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
