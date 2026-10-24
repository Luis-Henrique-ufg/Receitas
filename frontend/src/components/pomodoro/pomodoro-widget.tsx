import { useEffect, useState } from "react";
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
} from "lucide-react";
import { usePomodoroStore, PomodoroMode } from "@/store/usePomodoroStore";
import useApiUrl from "@/hooks/useApiUrl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function formatSeconds(totalSecs: number): string {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function PomodoroWidget() {
  const { apiUrl } = useApiUrl();
  const {
    mode,
    timeLeft,
    isRunning,
    sessionsCompleted,
    isMinimized,
    soundEnabled,
    durations,
    start,
    pause,
    reset,
    skip,
    setMode,
    tick,
    toggleMinimized,
    toggleSound,
    updateDurations,
  } = usePomodoroStore();

  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [customFocus, setCustomFocus] = useState(durations.focus);
  const [customBreak, setCustomBreak] = useState(durations.short_break);

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

  const modeLabels: Record<PomodoroMode, { label: string; icon: string; color: string }> = {
    focus: { label: "Foco", icon: "🍅", color: "from-rose-500 to-red-600" },
    short_break: { label: "Pausa Curta", icon: "☕", color: "from-amber-500 to-emerald-600" },
    long_break: { label: "Pausa Longa", icon: "🌴", color: "from-sky-500 to-indigo-600" },
  };

  const currentModeInfo = modeLabels[mode];

  const totalCurrentSeconds = durations[mode] * 60;
  const progressPercent = Math.max(0, Math.min(100, ((totalCurrentSeconds - timeLeft) / totalCurrentSeconds) * 100));

  function handleSaveSettings() {
    updateDurations({
      focus: Math.max(1, customFocus),
      short_break: Math.max(1, customBreak),
    });
    setIsEditingSettings(false);
  }

  if (isMinimized) {
    return (
      <div
        onClick={toggleMinimized}
        style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 70 }}
        className="flex items-center gap-2.5 px-4 py-2 rounded-full glass-panel glass-panel-hover border border-white/20 shadow-2xl cursor-pointer select-none transition-all duration-300 hover:scale-105 bg-[#050a14]/90 backdrop-blur-xl"
      >
        <span className="text-lg">{currentModeInfo.icon}</span>
        <span className="font-mono font-bold text-sm tracking-wider text-white">
          {formatSeconds(timeLeft)}
        </span>
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            isRunning ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
          )}
        />
        <Maximize2 className="w-3.5 h-3.5 text-zinc-400 hover:text-white ml-1" />
      </div>
    );
  }

  return (
    <div
      style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 70 }}
      className="w-80 rounded-2xl glass-panel border border-white/20 p-4 shadow-2xl backdrop-blur-2xl select-none animate-in fade-in slide-in-from-bottom-4 duration-200 bg-[#050a14]/95"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-lg">
          {(["focus", "short_break", "long_break"] as PomodoroMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                mode === m
                  ? "bg-white/20 text-white shadow-sm font-semibold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              )}
            >
              {modeLabels[m].label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleSound}
            title={soundEnabled ? "Som Ativado" : "Som Desativado"}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
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
          <div className="text-xs font-semibold text-zinc-300">Duração dos Ciclos (minutos)</div>
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
          {/* Progress ring or line */}
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-4">
            <div
              className={cn("h-full transition-all duration-500 bg-gradient-to-r", currentModeInfo.color)}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="text-5xl font-mono font-black tracking-tight text-white mb-2 drop-shadow-md">
            {formatSeconds(timeLeft)}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-4">
            <span>{currentModeInfo.icon} {currentModeInfo.label}</span>
            <span>•</span>
            <span>{sessionsCompleted} {sessionsCompleted === 1 ? "ciclo concluído" : "ciclos concluídos"}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={reset}
              title="Reiniciar Ciclo"
              className="w-9 h-9 rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            <Button
              onClick={isRunning ? pause : start}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95",
                isRunning
                  ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/25"
                  : "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-500/25"
              )}
            >
              {isRunning ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(apiUrl)}
              title="Pular Ciclo"
              className="w-9 h-9 rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
