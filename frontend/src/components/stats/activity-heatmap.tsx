import { useEffect, useState, useMemo } from "react";
import { Flame, Trophy, Clock, Timer, Sparkles, Calendar } from "lucide-react";
import { statsApi, HeatmapResponse, HeatmapDay } from "@/services/statsApi";
import useApiUrl from "@/hooks/useApiUrl";
import { cn } from "@/lib/utils";

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
}

function formatDateBr(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

const MONTH_NAMES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export default function ActivityHeatmap() {
  const { apiUrl } = useApiUrl();
  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);
  const [selectedDay, setSelectedDay] = useState<HeatmapDay | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats(showLoading = false) {
      try {
        if (showLoading) setIsLoading(true);
        // Load 364 days (52 weeks)
        const res = await statsApi.getHeatmap(apiUrl, 364);
        setData(res);
      } catch (err) {
        console.error("Erro ao carregar dados do heatmap:", err);
      } finally {
        if (showLoading) setIsLoading(false);
      }
    }

    loadStats(true);

    const handleStatsUpdated = () => {
      void loadStats(false);
    };

    window.addEventListener("statsUpdated", handleStatsUpdated);
    return () => {
      window.removeEventListener("statsUpdated", handleStatsUpdated);
    };
  }, [apiUrl]);

  // Group days into columns of 7 days (weeks) and invert so that Current Week (Today) is on the left
  const { weeks, monthLabels } = useMemo(() => {
    if (!data?.days || data.days.length === 0) {
      return { weeks: [], monthLabels: [] };
    }

    const cols: HeatmapDay[][] = [];
    let currentWeek: HeatmapDay[] = [];

    data.days.forEach((day, index) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || index === data.days.length - 1) {
        cols.push(currentWeek);
        currentWeek = [];
      }
    });

    // Invert the columns: Current Week (containing Today) becomes Column 0 on the far left
    const reversedCols = [...cols].reverse();

    // Detect month headers based on week start in the reversed layout
    const labels: Array<{ weekIndex: number; month: string }> = [];
    let lastMonth = -1;

    reversedCols.forEach((week, wIdx) => {
      if (week.length > 0) {
        const m = parseInt(week[0].date.split("-")[1], 10) - 1;
        if (m !== lastMonth) {
          labels.push({ weekIndex: wIdx, month: MONTH_NAMES[m] });
          lastMonth = m;
        }
      }
    });

    return { weeks: reversedCols, monthLabels: labels };
  }, [data]);

  const levelColors = [
    "bg-white/[0.04] border-white/[0.06] hover:border-white/30",
    "bg-blue-900/60 border-blue-700/50 hover:border-blue-400",
    "bg-blue-600/80 border-blue-500/60 hover:border-blue-300",
    "bg-[#007bff] border-blue-400/80 shadow-[0_0_8px_rgba(0,123,255,0.4)] hover:border-blue-200",
    "bg-cyan-400 border-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.6)] hover:border-white",
  ];

  if (isLoading) {
    return (
      <div className="w-full glass-panel rounded-2xl p-6 animate-pulse space-y-4">
        <div className="h-6 w-48 bg-white/10 rounded-md"></div>
        <div className="h-32 w-full bg-white/5 rounded-xl"></div>
      </div>
    );
  }

  const currentStreak = data?.current_streak ?? 0;
  const maxStreak = data?.max_streak ?? 0;
  const totalSeconds = data?.total_seconds ?? 0;
  const totalPomodoros = data?.total_pomodoros ?? 0;

  // Compute Today and This Week metrics
  const todaySeconds =
    data?.today_seconds ??
    (() => {
      if (!data?.days || data.days.length === 0) return 0;
      const todayStr = new Date().toISOString().split("T")[0];
      const match = data.days.find((d) => d.date === todayStr);
      return match ? match.study_seconds : 0;
    })();

  const weekActiveDays =
    data?.week_active_days ??
    (() => {
      if (!data?.days || data.days.length === 0) return 0;
      const recent = data.days.slice(-7);
      return recent.filter((d) => d.study_seconds > 0 || d.pomodoros > 0 || d.lessons > 0).length;
    })();

  const activeDetailDay = hoveredDay || selectedDay;

  return (
    <div className="w-full glass-panel rounded-2xl p-5 sm:p-7 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
      {/* Header & Metric Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/30 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-bold text-white tracking-tight flex items-center gap-2">
              Constância de Estudo
            </h2>
            <p className="text-xs text-zinc-300">
              Semana atual à esquerda com histórico diário de dedicação
            </p>
          </div>
        </div>

        {/* Compact Horizontal Badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Hoje */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-zinc-300">Hoje:</span>
            <span className="font-heading font-bold text-white font-mono">
              {formatDuration(todaySeconds)}
            </span>
          </div>

          {/* Esta semana */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-zinc-300">Esta semana:</span>
            <span className="font-heading font-bold text-white font-mono">
              {weekActiveDays}/7 dias
            </span>
          </div>

          {/* Sequência */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-zinc-300">Sequência:</span>
            <span className="font-heading font-bold text-white font-mono">
              {currentStreak} {currentStreak === 1 ? "dia" : "dias"}
            </span>
          </div>

          {/* Recorde */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-zinc-300">Recorde:</span>
            <span className="font-heading font-bold text-white font-mono">
              {maxStreak} {maxStreak === 1 ? "dia" : "dias"}
            </span>
          </div>

          {/* Pomodoros */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
            <Timer className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-zinc-300">Pomodoros:</span>
            <span className="font-heading font-bold text-white font-mono">
              {totalPomodoros} 🍅
            </span>
          </div>

          {/* Total Histórico */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
            <span className="text-zinc-400">Total:</span>
            <span className="font-mono font-medium text-zinc-300">
              {formatDuration(totalSeconds)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Heatmap Container: Horizontal stretch */}
      <div className="pt-6 space-y-2">
        <div className="overflow-x-auto pb-2 custom-scrollbar">
          <div className="min-w-[700px] w-full">
            {/* Month labels row */}
            <div className="flex w-full mb-1 text-[11px] text-zinc-400 font-mono pl-7">
              {weeks.map((_, wIdx) => {
                const labelObj = monthLabels.find((m) => m.weekIndex === wIdx);
                return (
                  <div key={wIdx} className="flex-1 text-left overflow-visible">
                    {labelObj ? (
                      <span className={cn(
                        "font-semibold",
                        wIdx === 0 ? "text-cyan-400" : "text-zinc-300"
                      )}>
                        {wIdx === 0 ? `${labelObj.month} (Atual)` : labelObj.month}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Grid with Day of Week labels on left */}
            <div className="flex w-full items-center gap-2">
              {/* Day Labels Column */}
              <div className="flex flex-col justify-between h-[112px] text-[10px] text-zinc-400 font-mono pr-1 select-none shrink-0 w-6">
                <span>Seg</span>
                <span>Qua</span>
                <span>Sex</span>
              </div>

              {/* Weeks Columns: Stretching across 100% of the horizontal width */}
              <div className="flex w-full justify-between gap-[3px]">
                {weeks.map((week, wIndex) => (
                  <div key={wIndex} className="flex flex-col gap-[3px] flex-1">
                    {week.map((day) => {
                      const isSelected = selectedDay?.date === day.date;
                      return (
                        <div
                          key={day.date}
                          tabIndex={0}
                          role="button"
                          aria-label={`Dia ${formatDateBr(day.date)}: ${formatDuration(day.study_seconds)}`}
                          onMouseEnter={() => setHoveredDay(day)}
                          onMouseLeave={() => setHoveredDay(null)}
                          onClick={() => setSelectedDay(isSelected ? null : day)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedDay(isSelected ? null : day);
                            }
                          }}
                          className={cn(
                            "w-full aspect-square rounded-[3px] border transition-all duration-150 cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-400",
                            isSelected && "ring-2 ring-white border-white scale-110 z-10",
                            levelColors[day.level]
                          )}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Details & Legend */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-300 pt-3 gap-2 border-t border-white/5">
          <div className="min-h-[22px] flex items-center">
            {activeDetailDay ? (
              <span className="text-white font-medium flex items-center gap-1.5 animate-in fade-in duration-150">
                <span className="text-cyan-400 font-mono font-bold">
                  {formatDateBr(activeDetailDay.date)}:
                </span>{" "}
                {formatDuration(activeDetailDay.study_seconds)} estudados
                {activeDetailDay.pomodoros > 0 ? ` • ${activeDetailDay.pomodoros} pomodoros` : ""}
                {activeDetailDay.lessons > 0 ? ` • ${activeDetailDay.lessons} aulas concluídas` : ""}
                {selectedDay?.date === activeDetailDay.date && (
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="ml-2 text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    (Limpar seleção)
                  </button>
                )}
              </span>
            ) : (
              <span className="text-zinc-400 text-[11px]">
                Passe o cursor ou toque nos dias para ver detalhes de estudo
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-400 shrink-0 select-none">
            <span>Menos</span>
            <div className="flex items-center gap-1">
              {levelColors.map((cls, idx) => (
                <div key={idx} className={cn("w-3 h-3 rounded-[2px] border", cls)} />
              ))}
            </div>
            <span>Mais</span>
          </div>
        </div>
      </div>
    </div>
  );
}

