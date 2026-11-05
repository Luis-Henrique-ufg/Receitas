import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  Target,
  Clock,
  Sparkles,
  ChevronDown,
  Trash2,
  Flame,
  Check,
  Settings2,
} from "lucide-react";
import { usePomodoroStore, PomodoroMode } from "@/store/usePomodoroStore";
import { pomodoroApi, PomodoroSessionItem } from "@/services/pomodoroApi";
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

function formatDurationHuman(totalSecs: number): string {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  if (h > 0) {
    return `${h}h${m > 0 ? ` ${m}m` : ""}`;
  }
  return `${m}m`;
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
    intention,
    setIntention,
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
  const [todaySessions, setTodaySessions] = useState<PomodoroSessionItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isImmersive, setIsImmersive] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [editingSessionSubjectId, setEditingSessionSubjectId] = useState<number | null>(null);

  // Local settings draft
  const [draftFocus, setDraftFocus] = useState(durations.focus);
  const [draftShortBreak, setDraftShortBreak] = useState(durations.short_break);
  const [draftLongBreak, setDraftLongBreak] = useState(durations.long_break);

  const intentionInputRef = useRef<HTMLInputElement>(null);

  const todayIso = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  // Fetch subjects
  const fetchSubjects = useCallback(async () => {
    try {
      const list = await subjectsApi.getAll(apiUrl, false);
      setSubjects(list);
    } catch (err) {
      console.error("Erro ao carregar matérias:", err);
    }
  }, [apiUrl]);

  // Fetch today's sessions
  const fetchTodaySessions = useCallback(async () => {
    try {
      setIsLoadingSessions(true);
      const data = await pomodoroApi.getSessions(apiUrl, todayIso);
      setTodaySessions(data);
    } catch (err) {
      console.error("Erro ao carregar sessões de hoje:", err);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [apiUrl, todayIso]);

  useEffect(() => {
    void fetchSubjects();
    void fetchTodaySessions();

    const handleUpdate = () => {
      void fetchTodaySessions();
    };

    window.addEventListener("statsUpdated", handleUpdate);
    window.addEventListener("pomodoroSessionCompleted", handleUpdate);
    window.addEventListener("subjectsUpdated", fetchSubjects);

    return () => {
      window.removeEventListener("statsUpdated", handleUpdate);
      window.removeEventListener("pomodoroSessionCompleted", handleUpdate);
      window.removeEventListener("subjectsUpdated", fetchSubjects);
    };
  }, [fetchSubjects, fetchTodaySessions]);

  // Daily goal calculation (default 2h = 7200s or from stored goals)
  const dailyGoalSeconds = useMemo(() => {
    try {
      const saved = localStorage.getItem("receitas_focus_goals");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.day) return parsed.day;
      }
    } catch {
      // ignore
    }
    return 2 * 3600; // 2 hours
  }, []);

  const totalTodayStudySeconds = useMemo(() => {
    return todaySessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
  }, [todaySessions]);

  const dailyGoalPercent = Math.min(
    100,
    Math.round((totalTodayStudySeconds / dailyGoalSeconds) * 100)
  );

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

  const activeSubjectColor = activeSubject ? activeSubject.color : "#64748b";
  const activeSubjectName = activeSubject
    ? activeSubject.name
    : currentSubjectName || "Sem matéria";

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
    toast.success("Configurações de tempo atualizadas!");
  };

  // Inline subject reassignment for past sessions
  const handleReassignSessionSubject = async (
    sessionId: number,
    newSubjectId: number | null
  ) => {
    try {
      const updated = await pomodoroApi.updateSession(apiUrl, sessionId, {
        subject_id: newSubjectId,
      });
      setTodaySessions((prev) =>
        prev.map((s) => (s.id === sessionId ? updated : s))
      );
      setEditingSessionSubjectId(null);
      window.dispatchEvent(new CustomEvent("statsUpdated"));
      window.dispatchEvent(new CustomEvent("subjectsUpdated"));
      toast.success(`Matéria atribuída: ${updated.subject_name}`);
    } catch {
      toast.error("Erro ao atualizar matéria da sessão.");
    }
  };

  // Delete session
  const handleDeleteSession = async (sessionId: number) => {
    if (!confirm("Tem certeza que deseja excluir esta sessão de foco?")) return;
    try {
      await pomodoroApi.deleteSession(apiUrl, sessionId);
      setTodaySessions((prev) => prev.filter((s) => s.id !== sessionId));
      window.dispatchEvent(new CustomEvent("statsUpdated"));
      toast.success("Sessão excluída.");
    } catch {
      toast.error("Erro ao excluir sessão.");
    }
  };

  // Global Keyboard Shortcuts
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

  // SVG Ring constants (r = 120)
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (ringProgress / 100) * circumference;

  return (
    <div
      className={cn(
        "w-full transition-all duration-300",
        isImmersive
          ? "fixed inset-0 z-[100] bg-[#050a14] flex flex-col items-center justify-center p-6 select-none"
          : "max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300"
      )}
    >
      {/* Top Header Bar (Hidden in Immersive Mode) */}
      {!isImmersive && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
          <div>
            <h1 className="text-2xl font-heading font-bold text-white tracking-tight flex items-center gap-2.5">
              <Clock className="w-6 h-6 text-blue-400 shrink-0" />
              <span>Sessão de Foco</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Timer circular imersivo, intenção de estudo e controle detalhado do seu dia.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={cn(
                "border-white/15 text-xs gap-1.5 transition-colors",
                isSettingsOpen
                  ? "bg-white/15 text-white"
                  : "bg-white/5 text-zinc-300 hover:text-white"
              )}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Ajustes</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImmersive(true)}
              className="border-white/15 bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white text-xs gap-1.5 shadow-sm"
              title="Modo Imersivo em Tela Cheia (F)"
            >
              <Maximize2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Modo Imersivo</span>
            </Button>
          </div>
        </div>
      )}

      {/* Immersive Exit Button */}
      {isImmersive && (
        <div className="absolute top-6 right-6 z-20">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImmersive(false)}
            className="border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs gap-1.5 backdrop-blur-md"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Sair do Modo Imersivo (Esc)</span>
          </Button>
        </div>
      )}

      {/* Settings Drawer (When opened) */}
      {isSettingsOpen && !isImmersive && (
        <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-[#090d18]/90 backdrop-blur-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-blue-400" />
              Configurações de Foco e Pomodoro
            </h3>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
            >
              Fechar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">
                Foco (minutos):
              </label>
              <input
                type="number"
                min={1}
                max={120}
                value={draftFocus}
                onChange={(e) => setDraftFocus(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">
                Pausa Curta (minutos):
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={draftShortBreak}
                onChange={(e) => setDraftShortBreak(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">
                Pausa Longa (minutos):
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={draftLongBreak}
                onChange={(e) => setDraftLongBreak(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-white/10">
            <div className="flex items-center gap-4 flex-wrap">
              <button
                type="button"
                onClick={toggleSound}
                className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white cursor-pointer"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-zinc-500" />
                )}
                <span>{soundEnabled ? "Sons ativados" : "Sons desativados"}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setCompletionBehavior(
                    completionBehavior === "flow" ? "strict" : "flow"
                  )
                }
                className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white cursor-pointer"
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    completionBehavior === "flow"
                      ? "bg-blue-400"
                      : "bg-zinc-500"
                  )}
                />
                <span>
                  {completionBehavior === "flow"
                    ? "Fluxo contínuo (prolongamento +MM:SS)"
                    : "Pausar automaticamente"}
                </span>
              </button>
            </div>

            <Button
              size="sm"
              onClick={handleSaveSettings}
              className="bg-[#007bff] hover:bg-white hover:text-[#007bff] text-white font-medium text-xs gap-1.5 transition-colors self-end"
            >
              <Check className="w-3.5 h-3.5" /> Salvar Ajustes
            </Button>
          </div>
        </div>
      )}

      {/* Main Grid: Left = Big Timer & Intention, Right = Today's Sessions & Goal */}
      <div
        className={cn(
          "w-full",
          isImmersive
            ? "flex flex-col items-center justify-center max-w-xl mx-auto"
            : "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        )}
      >
        {/* Left Column: Big Timer Canvas */}
        <div
          className={cn(
            "flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 bg-[#080d1a]/80 shadow-2xl relative overflow-hidden backdrop-blur-2xl",
            isImmersive ? "w-full border-none bg-transparent shadow-none" : "lg:col-span-7 xl:col-span-7"
          )}
        >
          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-1.5 bg-white/[0.04] p-1 rounded-2xl border border-white/10 mb-6 select-none">
            {(["focus", "short_break", "long_break"] as PomodoroMode[]).map(
              (m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border",
                    mode === m
                      ? "bg-white/15 text-white font-semibold border-white/20 shadow-sm"
                      : "text-zinc-400 hover:text-white border-transparent hover:bg-white/5"
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
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-2">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 260 260">
              {/* Background track */}
              <circle
                cx="130"
                cy="130"
                r={radius}
                className="stroke-white/10"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Animated Progress ring */}
              <circle
                cx="130"
                cy="130"
                r={radius}
                className={cn(
                  "transition-all duration-300 stroke-[#007bff]",
                  isOvertime ? "stroke-blue-400 opacity-90" : ""
                )}
                strokeWidth="10"
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
                <span className="glass-panel px-3 py-1 rounded-full text-[11px] font-medium text-blue-300 border border-blue-400/30 mb-2 inline-flex items-center gap-1.5 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Prolongamento</span>
                </span>
              ) : (
                <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                  {mode === "focus" ? "Tempo de Foco" : "Intervalo"}
                </span>
              )}

              {/* Main Clock Numbers */}
              <div
                className={cn(
                  "text-5xl sm:text-6xl font-mono font-bold tracking-tight text-white tabular-nums select-none",
                  isOvertime && "text-blue-300"
                )}
              >
                {isOvertime
                  ? `+${formatSeconds(overtimeSeconds)}`
                  : formatSeconds(timeLeft)}
              </div>

              {/* Subject Tag inside the circle */}
              <div className="mt-3 flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full shadow-sm"
                  style={{ backgroundColor: activeSubjectColor }}
                />
                <span className="text-xs font-medium text-zinc-300 truncate max-w-[150px]">
                  {activeSubjectName}
                </span>
              </div>
            </div>
          </div>

          {/* Subject & Intention Inputs Section */}
          <div className="w-full max-w-md mt-6 space-y-3">
            {/* Subject Selector Dropdown Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: activeSubjectColor }}
                  />
                  <span className="truncate">
                    Matéria: <strong className="text-white font-semibold">{activeSubjectName}</strong>
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              </button>

              {isSubjectDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-30 rounded-xl glass-panel border border-white/15 bg-[#0a0f1d] p-1.5 shadow-2xl max-h-48 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentSubject(null, null);
                      setIsSubjectDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left",
                      currentSubjectId === null
                        ? "bg-white/15 text-white font-medium"
                        : "text-zinc-300 hover:bg-white/10"
                    )}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-500 shrink-0" />
                    <span>Sem matéria</span>
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
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left",
                        currentSubjectId === sub.id
                          ? "bg-white/15 text-white font-medium"
                          : "text-zinc-300 hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: sub.color }}
                        />
                        <span className="truncate">{sub.name}</span>
                      </div>
                      {currentSubjectId === sub.id && (
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Intention Input */}
            <div>
              <input
                ref={intentionInputRef}
                type="text"
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder="O que vou estudar?"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Action Buttons Toolbar: Symmetrical, equal heights, zero jiggle */}
          <div className="flex items-center justify-center gap-2.5 mt-6 w-full max-w-md">
            {/* Left Slot: Stop & Record (when active/overtime) or Reset (when idle) */}
            {isRunning || isOvertime ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStopAndRecord}
                className="flex-1 h-11 rounded-xl border-white/15 bg-white/5 hover:bg-white/10 text-xs text-zinc-200 hover:text-white gap-2 font-medium cursor-pointer transition-all active:scale-95"
                title="Parar e Gravar Sessão (S)"
              >
                <Square className="w-3.5 h-3.5 fill-current text-rose-400 shrink-0" />
                <span className="truncate">Parar</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={reset}
                className="flex-1 h-11 rounded-xl border-white/15 bg-white/5 hover:bg-white/10 text-xs text-zinc-400 hover:text-white gap-2 font-medium cursor-pointer transition-all active:scale-95"
                title="Reiniciar Ciclo"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Reiniciar</span>
              </Button>
            )}

            {/* Center Slot: Play / Pause */}
            <Button
              onClick={isRunning ? pause : start}
              className="flex-1 h-11 rounded-xl bg-[#007bff] hover:bg-white text-white hover:text-[#007bff] [&:hover_svg]:fill-[#007bff] [&:hover_svg]:text-[#007bff] font-semibold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              title={isRunning ? "Pausar Timer (Espaço)" : "Iniciar Timer (Espaço)"}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current transition-colors shrink-0" />
                  <span className="truncate">Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current transition-colors shrink-0" />
                  <span className="truncate">Iniciar</span>
                </>
              )}
            </Button>

            {/* Right Slot: Mode Switch (Fazer Intervalo / Voltar ao Foco) */}
            {mode === "focus" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartBreak}
                className="flex-1 h-11 rounded-xl border-white/15 bg-white/5 hover:bg-white/10 text-xs text-zinc-200 hover:text-white gap-2 font-medium cursor-pointer transition-all active:scale-95"
                title="Fazer Intervalo de Descanso (B)"
              >
                <Coffee className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                <span className="truncate">Intervalo</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMode("focus")}
                className="flex-1 h-11 rounded-xl border-white/15 bg-white/5 hover:bg-white/10 text-xs text-zinc-200 hover:text-white gap-2 font-medium cursor-pointer transition-all active:scale-95"
                title="Voltar ao Modo Foco"
              >
                <Clock className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                <span className="truncate">Foco</span>
              </Button>
            )}
          </div>

          {/* Keyboard Shortcuts Hint Bar */}
          <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-6 select-none font-mono">
            <span>[Espaço] Iniciar/Pausar</span>
            <span>•</span>
            <span>[S] Parar</span>
            <span>•</span>
            <span>[B] Intervalo</span>
            <span>•</span>
            <span>[F] Imersivo</span>
          </div>
        </div>

        {/* Right Column: Today's Sessions & Daily Goal Ring (Hidden in Immersive Mode) */}
        {!isImmersive && (
          <div className="lg:col-span-5 xl:col-span-5 space-y-6">
            {/* Daily Goal Card */}
            <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-[#080d1a]/80 backdrop-blur-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-blue-400" /> Meta Diária
                </span>
                <span className="text-xs font-mono font-medium text-blue-400 tabular-nums">
                  {dailyGoalPercent}% concluído
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
                    {formatDurationHuman(totalTodayStudySeconds)}
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    de {formatDurationHuman(dailyGoalSeconds)} planejadas para hoje
                  </div>
                </div>

                <div className="w-14 h-14 rounded-full border-4 border-white/10 flex items-center justify-center relative">
                  <div
                    className="absolute inset-0 rounded-full border-4 border-blue-500 transition-all duration-500"
                    style={{
                      clipPath: `polygon(50% 50%, 50% 0%, ${
                        dailyGoalPercent >= 25 ? "100% 0%," : ""
                      }${dailyGoalPercent >= 50 ? "100% 100%," : ""}${
                        dailyGoalPercent >= 75 ? "0% 100%," : ""
                      }${dailyGoalPercent >= 100 ? "0% 0%," : ""}50% 0%)`,
                    }}
                  />
                  <Flame className="w-5 h-5 text-blue-400" />
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-4">
                <div
                  className="h-full bg-[#007bff] transition-all duration-500 rounded-full"
                  style={{ width: `${dailyGoalPercent}%` }}
                />
              </div>
            </div>

            {/* Today's Sessions List Card */}
            <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-[#080d1a]/80 backdrop-blur-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-400" /> Sessões de Hoje ({todaySessions.length})
                </span>
                {todaySessions.length > 0 && (
                  <span className="text-xs font-mono text-zinc-400 tabular-nums">
                    {formatDurationHuman(totalTodayStudySeconds)}
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-2.5 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                {isLoadingSessions ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-16 rounded-xl bg-white/[0.03] animate-pulse border border-white/10"
                      />
                    ))}
                  </div>
                ) : todaySessions.length === 0 ? (
                  <div className="p-6 text-center rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
                    <Clock className="w-6 h-6 text-zinc-500 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-medium text-zinc-400">
                      Nenhuma sessão concluída hoje
                    </p>
                  </div>
                ) : (
                  todaySessions.map((session) => {
                    const isEditing = editingSessionSubjectId === session.id;

                    return (
                      <div
                        key={session.id}
                        className="p-3 rounded-xl border border-white/10 bg-white/[0.03] hover:border-white/20 transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-white tabular-nums">
                                {session.start_time || "Sessão"} - {session.end_time || ""}
                              </span>
                              <span className="text-[11px] font-mono text-zinc-400 tabular-nums">
                                ({formatDurationHuman(session.duration_seconds)})
                              </span>
                            </div>

                            {session.intention && (
                              <p className="text-xs text-zinc-300 mt-1 truncate italic">
                                &quot;{session.intention}&quot;
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteSession(session.id)}
                            className="p-1 rounded text-zinc-500 hover:text-rose-400 transition-colors shrink-0 cursor-pointer"
                            title="Excluir sessão"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Editable Subject Inline Dropdown */}
                        <div className="pt-1 flex items-center justify-between border-t border-white/5">
                          {isEditing ? (
                            <div className="flex items-center gap-2 w-full">
                              <select
                                value={session.subject_id ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value === "" ? null : Number(e.target.value);
                                  void handleReassignSessionSubject(session.id, val);
                                }}
                                className="w-full text-xs bg-[#0f172a] text-white border border-white/20 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                              >
                                <option value="">Sem matéria</option>
                                {subjects.map((sub) => (
                                  <option key={sub.id} value={sub.id}>
                                    {sub.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => setEditingSessionSubjectId(null)}
                                className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditingSessionSubjectId(session.id)}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border border-white/10 hover:border-white/25 bg-white/[0.04] text-zinc-200 transition-colors cursor-pointer group"
                              title="Clique para alterar a matéria desta sessão"
                            >
                              <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: session.subject_color }}
                              />
                              <span className="truncate">{session.subject_name}</span>
                              <ChevronDown className="w-3 h-3 text-zinc-400 group-hover:text-white" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

