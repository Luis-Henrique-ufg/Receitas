import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Play,
  Pause,
  Square,
  Coffee,
  RotateCcw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronDown,
  Check,
  Settings2,
} from "lucide-react";
import { usePomodoroStore, PomodoroMode } from "@/store/usePomodoroStore";
import { subjectsApi } from "@/services/subjectsApi";
import { Subject } from "@/models/models";
import useApiUrl from "@/hooks/useApiUrl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function formatSeconds(totalSecs: number): string {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function FocusPage() {
  const { apiUrl } = useApiUrl();
  const {
    mode,
    timeLeft,
    isRunning,
    isOvertime,
    overtimeSeconds,
    durations,
    currentSubjectId,
    currentSubjectName,
    soundEnabled,
    completionBehavior,
    start,
    pause,
    reset,
    setMode,
    stopAndRecord,
    setCurrentSubject,
    updateDurations,
    toggleSound,
    setCompletionBehavior,
  } = usePomodoroStore();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isImmersive, setIsImmersive] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);

  // Local settings draft
  const [draftFocus, setDraftFocus] = useState(durations.focus);
  const [draftShortBreak, setDraftShortBreak] = useState(durations.short_break);
  const [draftLongBreak, setDraftLongBreak] = useState(durations.long_break);

  // Fetch subjects
  const fetchSubjects = useCallback(async () => {
    try {
      const list = await subjectsApi.getAll(apiUrl, false);
      setSubjects(list);
    } catch (err) {
      console.error("Erro ao carregar matérias:", err);
    }
  }, [apiUrl]);

  useEffect(() => {
    void fetchSubjects();
    window.addEventListener("subjectsUpdated", fetchSubjects);
    return () => {
      window.removeEventListener("subjectsUpdated", fetchSubjects);
    };
  }, [fetchSubjects]);

  // Ring progress
  const ringProgress = useMemo(() => {
    const totalDuration = durations[mode] * 60;
    if (isOvertime) return 100;
    if (totalDuration <= 0) return 0;
    const elapsed = totalDuration - timeLeft;
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  }, [durations, mode, isOvertime, timeLeft]);

  // Active Subject details
  const activeSubject = useMemo(() => {
    return subjects.find((s) => s.id === currentSubjectId) || null;
  }, [subjects, currentSubjectId]);

  const activeSubjectColor = activeSubject ? activeSubject.color : "#FF7020";
  const activeSubjectName = activeSubject
    ? activeSubject.name
    : currentSubjectName || "Geral";

  // Actions
  const handleStopAndRecord = () => {
    void stopAndRecord(apiUrl);
  };

  const handleStartBreak = () => {
    void stopAndRecord(apiUrl).then(() => {
      setMode("short_break");
      start();
    });
  };

  const handleSaveSettings = () => {
    updateDurations({
      focus: Math.max(1, draftFocus),
      short_break: Math.max(1, draftShortBreak),
      long_break: Math.max(1, draftLongBreak),
    });
    setIsSettingsOpen(false);
    toast.success("Configurações atualizadas!");
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        if (isRunning) pause();
        else start();
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (isRunning || isOvertime) handleStopAndRecord();
      } else if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        handleStartBreak();
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        setIsImmersive((prev) => !prev);
      } else if (e.key === "Escape") {
        if (isImmersive) {
          setIsImmersive(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRunning, isOvertime, isImmersive]);

  // SVG Ring constants (r = 130)
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (ringProgress / 100) * circumference;

  return (
    <div
      className={cn(
        "w-full transition-all duration-300 flex flex-col items-center justify-center",
        isImmersive
          ? "fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6 select-none"
          : "max-w-xl mx-auto py-8 sm:py-14 animate-in fade-in duration-300"
      )}
    >
      {/* Top Controls Bar (Ajustes e Tela Cheia) */}
      <div className={cn(
        "w-full flex items-center justify-end gap-2 mb-6",
        isImmersive ? "absolute top-6 right-6 z-20" : ""
      )}>
        {!isImmersive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={cn(
              "text-xs gap-1.5 transition-colors rounded-full px-3",
              isSettingsOpen
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            title="Ajustes de tempo"
          >
            <Settings2 className="w-4 h-4" />
            <span>Ajustes</span>
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsImmersive(!isImmersive)}
          className="text-muted-foreground hover:text-foreground hover:bg-muted text-xs gap-1.5 rounded-full px-3"
          title={isImmersive ? "Sair da Tela Cheia (Esc)" : "Modo Tela Cheia (F)"}
        >
          {isImmersive ? (
            <>
              <Minimize2 className="w-4 h-4" />
              <span>Sair</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4" />
              <span>Imersivo</span>
            </>
          )}
        </Button>
      </div>

      {/* Settings Drawer (When opened) */}
      {isSettingsOpen && !isImmersive && (
        <div className="w-full p-5 rounded-3xl border border-border bg-card shadow-sm mb-6 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" />
              Configurações
            </h3>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Fechar
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Foco (min)
              </label>
              <input
                type="number"
                min={1}
                max={120}
                value={draftFocus}
                onChange={(e) => setDraftFocus(Number(e.target.value))}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Pausa Curta
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={draftShortBreak}
                onChange={(e) => setDraftShortBreak(Number(e.target.value))}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Pausa Longa
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={draftLongBreak}
                onChange={(e) => setDraftLongBreak(Number(e.target.value))}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
            <div className="flex items-center gap-4 flex-wrap">
              <button
                type="button"
                onClick={toggleSound}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-primary" />
                ) : (
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                )}
                <span>{soundEnabled ? "Som ativo" : "Sem som"}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setCompletionBehavior(
                    completionBehavior === "flow" ? "strict" : "flow"
                  )
                }
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    completionBehavior === "flow"
                      ? "bg-primary"
                      : "bg-muted-foreground"
                  )}
                />
                <span>
                  {completionBehavior === "flow"
                    ? "Fluxo contínuo"
                    : "Pausar ao terminar"}
                </span>
              </button>
            </div>

            <Button
              size="sm"
              onClick={handleSaveSettings}
              className="font-medium text-xs gap-1.5 self-end"
            >
              <Check className="w-3.5 h-3.5" /> Salvar
            </Button>
          </div>
        </div>
      )}

      {/* Main Immersive Pomodoro Card */}
      <div className={cn(
        "w-full flex flex-col items-center justify-center p-8 sm:p-12 rounded-3xl transition-all",
        isImmersive
          ? "bg-transparent border-none shadow-none"
          : "bg-card border border-border shadow-sm"
      )}>
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-muted/40 p-1.5 rounded-full border border-border mb-8 select-none">
          {(["focus", "short_break", "long_break"] as PomodoroMode[]).map(
            (m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs transition-all cursor-pointer border",
                  mode === m
                    ? "bg-primary text-primary-foreground font-semibold border-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground border-transparent hover:bg-muted"
                )}
              >
                {m === "focus"
                  ? "Foco"
                  : m === "short_break"
                  ? "Pausa Curta"
                  : "Pausa Longa"}
              </button>
            )
          )}
        </div>

        {/* Big SVG Circular Progress Timer */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center my-2">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 280 280">
            {/* Background track */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              className="stroke-muted"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Animated Progress ring */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              className={cn(
                "transition-all duration-300 stroke-primary",
                isOvertime ? "stroke-orange-400 opacity-90" : ""
              )}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Content inside the ring */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {/* Overtime indicator badge */}
            {isOvertime ? (
              <span className="px-3 py-1 rounded-full text-[11px] font-medium text-primary bg-primary/10 border border-primary/30 mb-2 inline-flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Prolongamento</span>
              </span>
            ) : null}

            {/* Main Clock Numbers */}
            <div
              className={cn(
                "text-6xl sm:text-7xl font-mono font-bold tracking-tight text-foreground tabular-nums select-none",
                isOvertime && "text-primary"
              )}
            >
              {isOvertime
                ? `+${formatSeconds(overtimeSeconds)}`
                : formatSeconds(timeLeft)}
            </div>

            {/* Subject Selector Pill Inside/Under Timer */}
            <div className="relative mt-4">
              <button
                type="button"
                onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/40 hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: activeSubjectColor }}
                />
                <span className="truncate max-w-[140px]">{activeSubjectName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              {isSubjectDropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-30 w-52 rounded-2xl border border-border bg-card p-1.5 shadow-xl max-h-52 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentSubject(null, null);
                      setIsSubjectDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left",
                      currentSubjectId === null
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <div className="w-2 h-2 rounded-full bg-muted-foreground shrink-0" />
                    <span>Geral (sem matéria)</span>
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
                        "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left",
                        currentSubjectId === sub.id
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: sub.color }}
                        />
                        <span className="truncate">{sub.name}</span>
                      </div>
                      {currentSubjectId === sub.id && (
                        <Check className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center justify-center gap-3 mt-8 w-full max-w-sm">
          {/* Left Button: Stop/Reset */}
          {isRunning || isOvertime ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStopAndRecord}
              className="flex-1 h-12 rounded-2xl border-border bg-card hover:bg-muted text-xs text-foreground gap-2 font-medium cursor-pointer transition-all active:scale-95"
              title="Parar e Gravar"
            >
              <Square className="w-4 h-4 fill-current text-rose-500 shrink-0" />
              <span>Parar</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="flex-1 h-12 rounded-2xl border-border bg-card hover:bg-muted text-xs text-muted-foreground hover:text-foreground gap-2 font-medium cursor-pointer transition-all active:scale-95"
              title="Reiniciar"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span>Reiniciar</span>
            </Button>
          )}

          {/* Center Button: Play/Pause */}
          <Button
            onClick={isRunning ? pause : start}
            className="flex-1 h-12 rounded-2xl font-semibold text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            title={isRunning ? "Pausar" : "Iniciar"}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current shrink-0" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current shrink-0" />
                <span>Iniciar</span>
              </>
            )}
          </Button>

          {/* Right Button: Break/Focus toggle */}
          {mode === "focus" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartBreak}
              className="flex-1 h-12 rounded-2xl border-border bg-card hover:bg-muted text-xs text-foreground gap-2 font-medium cursor-pointer transition-all active:scale-95"
              title="Intervalo"
            >
              <Coffee className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>Intervalo</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMode("focus")}
              className="flex-1 h-12 rounded-2xl border-border bg-card hover:bg-muted text-xs text-foreground gap-2 font-medium cursor-pointer transition-all active:scale-95"
              title="Modo Foco"
            >
              <Play className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>Foco</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
