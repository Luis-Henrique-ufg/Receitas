import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Flame, Sparkles, ChevronDown, AlertCircle, RotateCcw } from "lucide-react";
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

// Distinct, high-contrast levels: Level 1 is clearly distinguished from empty Level 0
const levelColors = [
  "bg-white/[0.04] border-white/[0.08] hover:border-white/30",
  "bg-blue-800/80 border-blue-600/70 hover:border-blue-400",
  "bg-blue-600/90 border-blue-500/80 hover:border-blue-300",
  "bg-[#007bff] border-blue-400 shadow-[0_0_8px_rgba(0,123,255,0.4)] hover:border-blue-200",
  "bg-cyan-400 border-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.6)] hover:border-white",
];

// Row index 0 = Monday, Row 2 = Wednesday, Row 4 = Friday
const DAY_ROW_LABELS: (string | null)[] = [
  "Seg", // row 0: Monday
  null,  // row 1: Tuesday
  "Qua", // row 2: Wednesday
  null,  // row 3: Thursday
  "Sex", // row 4: Friday
  null,  // row 5: Saturday
  null,  // row 6: Sunday
];

export default function ActivityHeatmap() {
  const { apiUrl } = useApiUrl();
  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);
  const [selectedDay, setSelectedDay] = useState<HeatmapDay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // View mode: compact 14 weeks (~98 days) vs full year (~364 days)
  const [viewMode, setViewMode] = useState<"compact" | "full">("compact");
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  // Dynamic cell sizing and scroll refs
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState<number>(18);
  const cellGap = 3;
  const monthHeaderHeight = 22;

  const loadStats = useCallback(
    async (showLoading = false) => {
      try {
        if (showLoading) setIsLoading(true);
        setHasError(false);
        const daysToLoad = viewMode === "compact" ? 98 : 364;
        const res = await statsApi.getHeatmap(apiUrl, daysToLoad, selectedCourseId);
        setData(res);
      } catch (err) {
        console.error("Erro ao carregar dados do heatmap:", err);
        setHasError(true);
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [apiUrl, viewMode, selectedCourseId]
  );

  useEffect(() => {
    loadStats(true);

    const handleStatsUpdated = () => {
      void loadStats(false);
    };

    window.addEventListener("statsUpdated", handleStatsUpdated);
    return () => {
      window.removeEventListener("statsUpdated", handleStatsUpdated);
    };
  }, [loadStats]);

  // Today ISO date in user's local timezone (America/Sao_Paulo / client clock)
  const todayIso = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Organize days into calendar columns (Monday = 0, Sunday = 6)
  // Time flows left to right (oldest on left, present on far right)
  const { weeks, monthLabels } = useMemo(() => {
    if (!data?.days || data.days.length === 0) {
      return { weeks: [], monthLabels: [] };
    }

    const cols: (HeatmapDay | null)[][] = [];
    let currentCol: (HeatmapDay | null)[] = [];

    // The first day in dataset determines initial day-of-week padding
    const firstDay = data.days[0];
    const firstDateObj = new Date(firstDay.date + "T00:00:00");
    const firstDayOfWeek = (firstDateObj.getDay() + 6) % 7; // 0 = Mon, 6 = Sun

    // Pad beginning of the first week so Monday is always row 0
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentCol.push(null);
    }

    data.days.forEach((day) => {
      currentCol.push(day);
      if (currentCol.length === 7) {
        cols.push(currentCol);
        currentCol = [];
      }
    });

    if (currentCol.length > 0) {
      while (currentCol.length < 7) {
        currentCol.push(null);
      }
      cols.push(currentCol);
    }

    // Detect month labels
    const rawLabels: Array<{ weekIndex: number; month: string }> = [];
    let lastMonth = -1;

    cols.forEach((col, wIdx) => {
      const validDay = col.find((d) => d !== null);
      if (validDay) {
        const m = parseInt(validDay.date.split("-")[1], 10) - 1;
        if (m !== lastMonth) {
          rawLabels.push({ weekIndex: wIdx, month: MONTH_NAMES[m] });
          lastMonth = m;
        }
      }
    });

    // Drop the first month label if it has fewer than 3 columns before next month to avoid "utNov" overlap
    let finalLabels = rawLabels;
    if (rawLabels.length >= 2 && rawLabels[1].weekIndex - rawLabels[0].weekIndex < 3) {
      finalLabels = rawLabels.slice(1);
    }

    return { weeks: cols, monthLabels: finalLabels };
  }, [data]);

  // Dynamic cell sizing via ResizeObserver
  useEffect(() => {
    const el = gridContainerRef.current;
    if (!el) return;

    const updateCellSize = () => {
      const containerWidth = el.clientWidth;
      if (containerWidth <= 0) return;

      const numWeeks = weeks.length || (viewMode === "compact" ? 14 : 52);
      // Available width subtracting 32px for day labels and padding
      const availableWidth = containerWidth - 32;
      const totalGaps = (numWeeks - 1) * cellGap;
      const calculated = Math.floor((availableWidth - totalGaps) / numWeeks);

      if (viewMode === "compact") {
        setCellSize(Math.max(14, Math.min(22, calculated)));
      } else {
        // Full year: clamp to fit without scrolling on desktop, allow horizontal scroll on mobile
        setCellSize(Math.max(11, Math.min(16, calculated)));
      }
    };

    updateCellSize();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateCellSize);
      observer.observe(el);

      return () => {
        observer.disconnect();
      };
    }
  }, [weeks.length, viewMode, cellGap]);

  // Keep scroll position to the rightmost (most recent days) on view mode change or resize
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [viewMode, weeks.length, cellSize]);

  const activeDetailDay = hoveredDay || selectedDay;
  const availableCourses: AvailableCourse[] = data?.available_courses || [];

  const currentStreak = data?.current_streak ?? 0;
  const maxStreak = data?.max_streak ?? 0;

  // Today metrics
  const todaySeconds =
    data?.today_seconds ??
    (() => {
      if (!data?.days) return 0;
      const match = data.days.find((d) => d.date === todayIso);
      return match ? match.study_seconds : 0;
    })();

  const todayPomodoros = (() => {
    if (!data?.days) return 0;
    const match = data.days.find((d) => d.date === todayIso);
    return match ? match.pomodoros : 0;
  })();

  const weekSeconds = data?.week_seconds ?? 0;
  const deltaWeekSeconds = data?.delta_week_seconds ?? 0;
  // If previous week was 0, delta is not a meaningful comparison
  const hasMeaningfulDelta =
    deltaWeekSeconds !== 0 &&
    (data?.last_week_seconds !== undefined
      ? data.last_week_seconds > 0
      : deltaWeekSeconds !== weekSeconds);

  // 1. Error State
  if (hasError && !data) {
    return (
      <div className="w-full glass-panel rounded-2xl p-5 border border-rose-500/20 shadow-2xl backdrop-blur-2xl bg-rose-950/10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-rose-400" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-white">
                Não foi possível carregar o histórico de estudos
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Ocorreu uma falha na comunicação com o servidor.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => loadStats(true)}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-medium text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Tentar novamente</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Loading Skeleton State
  if (isLoading && !data) {
    return (
      <div className="w-full glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 shadow-2xl animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-44 bg-white/10 rounded-md" />
          <div className="h-7 w-28 bg-white/10 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6">
          <div className="h-32 bg-white/5 rounded-xl" />
          <div className="space-y-3 border-l border-white/10 pl-5">
            <div className="h-9 bg-white/10 rounded-lg" />
            <div className="h-9 bg-white/10 rounded-lg" />
            <div className="h-9 bg-white/10 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
      {/* Header: Title and Aligned Segmented Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/30 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <h2 className="text-base font-heading font-semibold text-white tracking-tight">
            Constância de estudo
          </h2>
        </div>

        {/* Controls: Course Select with Content Width + Segmented Period Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {availableCourses.length > 0 && (
            <div className="relative max-w-[170px] sm:max-w-[210px]">
              <select
                value={selectedCourseId ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCourseId(val === "" ? null : Number(val));
                }}
                className="w-full truncate appearance-none bg-white/[0.04] hover:bg-white/[0.08] text-xs text-zinc-200 border border-white/10 rounded-lg pl-2.5 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer font-medium transition-colors"
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

          {/* Segmented Period Switcher (14 sem / Ano) */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-white/[0.04] border border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("compact")}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
                viewMode === "compact"
                  ? "bg-[#007bff]/30 text-white shadow-sm border border-blue-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              14 sem
            </button>
            <button
              type="button"
              onClick={() => setViewMode("full")}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
                viewMode === "full"
                  ? "bg-[#007bff]/30 text-white shadow-sm border border-blue-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Ano
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Left = Heatmap Grid, Right = 3 Indicators */}
      <div className="pt-3.5 flex flex-col lg:flex-row items-start gap-8">
        {/* Left Column: Fixed Day Labels + Heatmap Grid Scroller */}
        <div className="flex flex-col min-w-0" ref={gridContainerRef}>
          <div className="flex items-start gap-1.5 w-full">
            {/* Day of Week Labels (Seg, Qua, Sex) placed OUTSIDE scroller, strictly aligned with cells */}
            <div
              className="flex flex-col select-none pr-1 w-6 shrink-0"
              style={{
                marginTop: `${monthHeaderHeight + 6}px`,
                gap: `${cellGap}px`,
              }}
            >
              {DAY_ROW_LABELS.map((label, idx) => (
                <div
                  key={idx}
                  style={{ height: `${cellSize}px` }}
                  className="flex items-center justify-end text-[10px] text-zinc-400 font-sans leading-none"
                >
                  {label || ""}
                </div>
              ))}
            </div>

            {/* Scrollable Heatmap Grid Container: hidden scrollbar */}
            <div
              ref={scrollContainerRef}
              className="overflow-x-auto overflow-y-hidden scrollbar-none [&::-webkit-scrollbar]:hidden flex-1 min-w-0 pt-1.5 pb-2.5 px-1.5"
            >
              <div className="inline-block min-w-max">
                {/* Months Header Row */}
                <div
                  className="flex mb-1.5 text-[11px] text-zinc-400 font-sans select-none"
                  style={{ height: `${monthHeaderHeight - 6}px`, gap: `${cellGap}px` }}
                >
                  {weeks.map((_, wIdx) => {
                    const labelObj = monthLabels.find((m) => m.weekIndex === wIdx);
                    return (
                      <div
                        key={wIdx}
                        style={{ width: `${cellSize}px` }}
                        className="text-left overflow-visible relative shrink-0"
                      >
                        {labelObj ? (
                          <span className="font-medium text-zinc-400 whitespace-nowrap absolute left-0 top-0">
                            {labelObj.month}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {/* Weeks Columns */}
                <div className="flex" style={{ gap: `${cellGap}px` }}>
                  {weeks.map((week, wIndex) => (
                    <div key={wIndex} className="flex flex-col" style={{ gap: `${cellGap}px` }}>
                      {week.map((day, dIndex) => {
                        if (!day) {
                          return (
                            <div
                              key={`empty-${wIndex}-${dIndex}`}
                              style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                              className="rounded-[2px] opacity-0 pointer-events-none"
                            />
                          );
                        }

                        const isSelected = selectedDay?.date === day.date;
                        const isToday = day.date === todayIso;

                        return (
                          <div
                            key={day.date}
                            tabIndex={0}
                            role="button"
                            aria-label={`Dia ${formatDateBr(day.date)}: ${formatDuration(day.study_seconds)}`}
                            onMouseEnter={() => setHoveredDay(day)}
                            onMouseLeave={() => setHoveredDay(null)}
                            onFocus={() => setHoveredDay(day)}
                            onBlur={() => setHoveredDay(null)}
                            onClick={() => setSelectedDay(isSelected ? null : day)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedDay(isSelected ? null : day);
                              }
                            }}
                            style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                            className={cn(
                              "relative rounded-[2px] border transition-all duration-150 cursor-pointer focus:outline-none",
                              levelColors[day.level],
                              "hover:z-20 hover:ring-1 hover:ring-white/80",
                              isSelected
                                ? "ring-2 ring-white border-white scale-110 z-30 shadow-lg"
                                : isToday
                                ? "ring-2 ring-[#007bff] ring-offset-1 ring-offset-[#080d1a] z-10"
                                : ""
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

          {/* Contextual Detail Bar below Heatmap (OUTSIDE the scroller, never truncated) */}
          <div className="min-h-[22px] flex items-center text-xs text-zinc-300 pt-3">
            {activeDetailDay ? (
              <span className="text-white font-normal flex items-center gap-1.5 animate-in fade-in duration-150 flex-wrap">
                <span className="text-cyan-400 font-semibold tabular-nums">
                  {formatDateBr(activeDetailDay.date)}:
                </span>{" "}
                <span className="font-medium text-white tabular-nums">
                  {formatDuration(activeDetailDay.study_seconds)}
                </span>
                {activeDetailDay.courses && activeDetailDay.courses.length > 0 ? (
                  <span className="text-zinc-300">
                    · {activeDetailDay.courses.map((c) => c.name).join(", ")}
                  </span>
                ) : activeDetailDay.study_seconds > 0 ? (
                  <span className="text-zinc-400">· Atividade geral</span>
                ) : (
                  <span className="text-zinc-500">· Sem registros</span>
                )}
                {activeDetailDay.pomodoros > 0 && (
                  <span className="text-rose-300 tabular-nums">
                    • {activeDetailDay.pomodoros} {activeDetailDay.pomodoros === 1 ? "pomodoro" : "pomodoros"}
                  </span>
                )}
                {activeDetailDay.lessons > 0 && (
                  <span className="text-blue-300 tabular-nums">
                    • {activeDetailDay.lessons} {activeDetailDay.lessons === 1 ? "aula concluída" : "aulas concluídas"}
                  </span>
                )}
                {selectedDay?.date === activeDetailDay.date && (
                  <button
                    type="button"
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
        </div>

        {/* Right Column: 3 Grouped Indicators in Single Stack */}
        <div className="flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/10 pt-3 lg:pt-0 lg:pl-8 min-w-[210px] space-y-3.5 self-stretch">
          {/* 1. Hoje */}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-zinc-400 font-medium tracking-wide">Hoje</span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base sm:text-lg font-bold text-white tabular-nums tracking-tight">
                {formatDuration(todaySeconds)}
              </span>
              {todayPomodoros > 0 && (
                <span className="text-xs text-zinc-400 font-normal tabular-nums">
                  ({todayPomodoros} {todayPomodoros === 1 ? "pomodoro" : "pomodoros"})
                </span>
              )}
            </div>
          </div>

          {/* 2. Esta semana: Delta shown only when previous week > 0 */}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-zinc-400 font-medium tracking-wide">Esta semana</span>
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-bold text-white tabular-nums tracking-tight">
                {formatDuration(weekSeconds)}
              </span>
              {hasMeaningfulDelta && (
                <span
                  className={cn(
                    "text-xs font-semibold tabular-nums",
                    deltaWeekSeconds > 0 ? "text-emerald-400" : "text-zinc-400"
                  )}
                >
                  {deltaWeekSeconds > 0
                    ? `+${formatDuration(deltaWeekSeconds)}`
                    : `-${formatDuration(Math.abs(deltaWeekSeconds))}`}
                </span>
              )}
            </div>
          </div>

          {/* 3. Sequência */}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-zinc-400 font-medium tracking-wide">Sequência</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-bold text-white tabular-nums tracking-tight flex items-center gap-1">
                <Flame
                  className={cn(
                    "w-4 h-4 shrink-0",
                    currentStreak > 0 ? "text-amber-400 fill-amber-400" : "text-zinc-500"
                  )}
                />
                <span>{currentStreak} {currentStreak === 1 ? "dia" : "dias"}</span>
              </span>
              <span className="text-xs text-zinc-400 font-normal">
                (recorde: {maxStreak})
              </span>
            </div>
          </div>

          {/* Heatmap Legend */}
          <div className="flex items-center gap-2 text-[10px] text-zinc-400 pt-1 select-none border-t border-white/5">
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
