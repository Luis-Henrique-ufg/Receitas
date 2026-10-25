import { useEffect, useState, useMemo } from "react";
import { Flame, Trophy, Clock, Timer, Sparkles, Calendar, ChevronDown, Layers } from "lucide-react";
import { statsApi, HeatmapResponse, HeatmapDay, AvailableCourse } from "@/services/statsApi";
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

  // View mode: compact 14 weeks (~98 days) vs full year (~364 days)
  const [viewMode, setViewMode] = useState<"compact" | "full">("compact");
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  useEffect(() => {
    async function loadStats(showLoading = false) {
      try {
        if (showLoading) setIsLoading(true);
        const daysToLoad = viewMode === "compact" ? 98 : 364;
        const res = await statsApi.getHeatmap(apiUrl, daysToLoad, selectedCourseId);
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
  }, [apiUrl, viewMode, selectedCourseId]);

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

  if (isLoading && !data) {
    return (
      <div className="w-full glass-panel rounded-2xl p-4 sm:p-5 animate-pulse space-y-3">
        <div className="h-5 w-48 bg-white/10 rounded-md"></div>
        <div className="h-24 w-full bg-white/5 rounded-xl"></div>
      </div>
    );
  }

  const currentStreak = data?.current_streak ?? 0;
  const maxStreak = data?.max_streak ?? 0;
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

  const weekSeconds = data?.week_seconds ?? 0;
  const deltaWeekSeconds = data?.delta_week_seconds ?? 0;

  const weekActiveDays =
    data?.week_active_days ??
    (() => {
      if (!data?.days || data.days.length === 0) return 0;
      const recent = data.days.slice(-7);
      return recent.filter((d) => d.study_seconds > 0 || d.pomodoros > 0 || d.lessons > 0).length;
    })();

  const activeDetailDay = hoveredDay || selectedDay;
  const availableCourses: AvailableCourse[] = data?.available_courses || [];

  // Formatted weekly comparison summary (e.g. "+1h 10m vs. sem. anterior")
  const deltaFormatted =
    deltaWeekSeconds === 0
      ? "estável vs. sem. anterior"
      : deltaWeekSeconds > 0
      ? `+${formatDuration(deltaWeekSeconds)} vs. sem. anterior`
      : `-${formatDuration(Math.abs(deltaWeekSeconds))} vs. sem. anterior`;

  return (
    <div className="w-full glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
      {/* Header & Metric Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/30 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-heading font-bold text-white tracking-tight flex items-center gap-2">
                Constância de Estudo
              </h2>
              <p className="text-[11px] text-zinc-400">
                Semana atual à esquerda · histórico recente de foco
              </p>
            </div>
          </div>

          {/* Controls: Course Filter & View Mode Toggle */}
          <div className="flex items-center gap-2 self-start lg:self-center">
            {/* Course Selector Dropdown */}
            {availableCourses.length > 0 && (
              <div className="relative">
                <select
                  value={selectedCourseId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedCourseId(val === "" ? null : Number(val));
                  }}
                  className="appearance-none bg-white/[0.04] hover:bg-white/[0.08] text-xs text-zinc-200 border border-white/10 rounded-lg px-2.5 py-1.5 pr-7 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer font-medium transition-colors"
                  aria-label="Filtrar heatmap por curso"
                >
                  <option value="" className="bg-[#050a14] text-white">
                    Todos os cursos
                  </option>
                  {availableCourses.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#050a14] text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 top-2 pointer-events-none" />
              </div>
            )}

            {/* View Mode Toggle: 14 weeks / Full year */}
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "compact" ? "full" : "compact")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Alternar período de visualização"
            >
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>{viewMode === "compact" ? "14 sem" : "Ano"}</span>
            </button>
          </div>
        </div>

        {/* Badges: Focus on Present Metrics (Hoje, Esta semana com delta, Sequência, Pomodoros) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Hoje */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-zinc-300">Hoje:</span>
            <span className="font-semibold text-white font-mono tabular-nums">
              {formatDuration(todaySeconds)}
            </span>
          </div>

          {/* Esta semana + Comparativo vs semana anterior */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/10 text-xs">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-zinc-300">Esta semana:</span>
            <span className="font-semibold text-white font-mono tabular-nums">
              {formatDuration(weekSeconds)}
            </span>
            <span className="text-[11px] text-zinc-400 hidden sm:inline">
              ({weekActiveDays}/7d · {deltaFormatted})
            </span>
          </div>

          {/* Sequência */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/10 text-xs">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-zinc-300">Sequência:</span>
            <span className="font-semibold text-white font-mono tabular-nums">
              {currentStreak} {currentStreak === 1 ? "dia" : "dias"}
            </span>
          </div>

          {/* Recorde */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/10 text-xs">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-zinc-300">Recorde:</span>
            <span className="font-semibold text-white font-mono tabular-nums">
              {maxStreak} {maxStreak === 1 ? "dia" : "dias"}
            </span>
          </div>

          {/* Pomodoros */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/10 text-xs">
            <Timer className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-zinc-300">Pomodoros:</span>
            <span className="font-semibold text-white font-mono tabular-nums">
              {totalPomodoros} 🍅
            </span>
          </div>
        </div>
      </div>

      {/* Main Heatmap Container: Compact Strip */}
      <div className="pt-3.5 space-y-1.5">
        <div className="overflow-x-auto pb-1 custom-scrollbar">
          <div className={cn("w-full", viewMode === "compact" ? "min-w-[420px]" : "min-w-[700px]")}>
            {/* Month labels row */}
            <div className="flex w-full mb-1 text-[11px] text-zinc-400 font-sans pl-7 select-none">
              {weeks.map((_, wIdx) => {
                const labelObj = monthLabels.find((m) => m.weekIndex === wIdx);
                return (
                  <div key={wIdx} className="flex-1 text-left overflow-visible">
                    {labelObj ? (
                      <span className={cn(
                        "font-medium",
                        wIdx === 0 ? "text-cyan-400 font-semibold" : "text-zinc-400"
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
              <div className="flex flex-col justify-between h-[84px] text-[10px] text-zinc-400 font-sans pr-1 select-none shrink-0 w-6">
                <span>Seg</span>
                <span>Qua</span>
                <span>Sex</span>
              </div>

              {/* Weeks Columns: Compact aspect-ratio cells */}
              <div className="flex w-full justify-between gap-[2.5px]">
                {weeks.map((week, wIndex) => (
                  <div key={wIndex} className="flex flex-col gap-[2.5px] flex-1">
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
                            "w-full aspect-square rounded-[2px] border transition-all duration-150 cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-400",
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

        {/* Footer: Contextual Details & Legend */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-300 pt-2.5 gap-2 border-t border-white/5">
          <div className="min-h-[20px] flex items-center">
            {activeDetailDay ? (
              <span className="text-white font-normal flex items-center gap-1.5 animate-in fade-in duration-150">
                <span className="text-cyan-400 font-semibold font-mono tabular-nums">
                  {formatDateBr(activeDetailDay.date)}:
                </span>{" "}
                <span className="font-medium text-white">
                  {formatDuration(activeDetailDay.study_seconds)}
                </span>
                {/* Enriched Contextual Course Breakdown */}
                {activeDetailDay.courses && activeDetailDay.courses.length > 0 ? (
                  <span className="text-zinc-300">
                    · {activeDetailDay.courses.map((c) => c.name).join(", ")}
                  </span>
                ) : activeDetailDay.study_seconds > 0 ? (
                  <span className="text-zinc-400">· Atividade geral</span>
                ) : (
                  <span className="text-zinc-500">· Sem registros</span>
                )}
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
                Passe o cursor ou toque nos dias para ver detalhes e cursos estudados
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-400 shrink-0 select-none">
            <span>Menos</span>
            <div className="flex items-center gap-1">
              {levelColors.map((cls, idx) => (
                <div key={idx} className={cn("w-2.5 h-2.5 rounded-[2px] border", cls)} />
              ))}
            </div>
            <span>Mais</span>
          </div>
        </div>
      </div>
    </div>
  );
}


