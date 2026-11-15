import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Flame, Calendar, ChevronDown, AlertCircle, RotateCcw } from "lucide-react";
import { statsApi, HeatmapResponse, HeatmapDay, AvailableSubject } from "@/services/statsApi";
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

// Tangerina Solar Orange levels (orange saturation strictly proportional to study time)
const levelColors = [
  "bg-muted/40 border-border/40 hover:border-border",
  "bg-primary/20 border-primary/30 hover:border-primary/50",
  "bg-primary/45 border-primary/50 hover:border-primary/70",
  "bg-primary/75 border-primary/70 hover:border-primary/90",
  "bg-primary border-primary hover:border-primary shadow-[0_0_8px_rgba(255,112,32,0.35)]",
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

const DAY_LETTERS = ["S", "T", "Q", "Q", "S", "S", "D"];

export default function ActivityHeatmap() {
  const { apiUrl } = useApiUrl();
  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);
  const [selectedDay, setSelectedDay] = useState<HeatmapDay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Subject filter
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

  // Dynamic cell sizing and scroll refs
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState<number>(16);
  const cellGap = 3.5;
  const monthHeaderHeight = 22;

  const loadStats = useCallback(
    async (showLoading = false) => {
      try {
        if (showLoading) setIsLoading(true);
        setHasError(false);
        const currentYear = new Date().getFullYear();
        const res = await statsApi.getHeatmap(
          apiUrl,
          null,
          null,
          selectedSubjectId,
          currentYear
        );
        setData(res);
      } catch (err) {
        console.error("Erro ao carregar dados do heatmap:", err);
        setHasError(true);
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [apiUrl, selectedSubjectId]
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
  const { weeks, monthLabels } = useMemo(() => {
    if (!data?.days || data.days.length === 0) {
      return { weeks: [], monthLabels: [] };
    }

    const cols: HeatmapDay[][] = [];
    let currentCol: HeatmapDay[] = [];

    // The first day in dataset determines initial day-of-week padding
    const firstDay = data.days[0];
    const firstDateObj = new Date(firstDay.date + "T00:00:00");
    const firstDayOfWeek = (firstDateObj.getDay() + 6) % 7; // 0 = Mon, 6 = Sun

    for (let i = 0; i < firstDayOfWeek; i++) {
      const padDate = new Date(firstDateObj);
      padDate.setDate(firstDateObj.getDate() - (firstDayOfWeek - i));
      const padIso = padDate.toISOString().split("T")[0];
      currentCol.push({
        date: padIso,
        study_seconds: 0,
        pomodoros: 0,
        lessons: 0,
        level: 0,
      });
    }

    data.days.forEach((day) => {
      currentCol.push(day);
      if (currentCol.length === 7) {
        cols.push(currentCol);
        currentCol = [];
      }
    });

    if (currentCol.length > 0) {
      const lastDay = currentCol[currentCol.length - 1];
      const lastDateObj = new Date(lastDay.date + "T00:00:00");
      let count = 1;
      while (currentCol.length < 7) {
        const padDate = new Date(lastDateObj);
        padDate.setDate(lastDateObj.getDate() + count);
        const padIso = padDate.toISOString().split("T")[0];
        currentCol.push({
          date: padIso,
          study_seconds: 0,
          pomodoros: 0,
          lessons: 0,
          level: 0,
        });
        count++;
      }
      cols.push(currentCol);
    }

    const rawLabels: Array<{ weekIndex: number; month: string }> = [];
    const seenMonths = new Set<number>();

    cols.forEach((col, wIdx) => {
      const firstOfMonthDay = col.find((d) => d.date.endsWith("-01"));
      if (firstOfMonthDay) {
        const m = parseInt(firstOfMonthDay.date.split("-")[1], 10) - 1;
        if (!seenMonths.has(m)) {
          seenMonths.add(m);
          rawLabels.push({ weekIndex: wIdx, month: MONTH_NAMES[m] });
        }
      }
    });

    if (rawLabels.length === 0 && cols.length > 0 && cols[0][0]) {
      const m = parseInt(cols[0][0].date.split("-")[1], 10) - 1;
      rawLabels.push({ weekIndex: 0, month: MONTH_NAMES[m] });
    }

    return { weeks: cols, monthLabels: rawLabels };
  }, [data]);

  // Extract recent 7 days ending with today for Tangerina Spotlight Card
  const recentDays = useMemo(() => {
    if (!data?.days || data.days.length === 0) return [];
    const pastAndToday = data.days.filter((d) => d.date <= todayIso);
    return pastAndToday.slice(-7);
  }, [data?.days, todayIso]);

  // Dynamic cell sizing via ResizeObserver for expanded 365-day matrix
  useEffect(() => {
    if (!isExpanded) return;
    const el = gridContainerRef.current;
    if (!el) return;

    const updateCellSize = () => {
      const containerWidth = el.clientWidth;
      if (containerWidth <= 0) return;

      const numWeeks = weeks.length || 53;
      const availableWidth = containerWidth - 32;
      const totalGaps = (numWeeks - 1) * cellGap;
      const calculated = Math.floor((availableWidth - totalGaps) / numWeeks);

      setCellSize(Math.max(16, Math.min(22, calculated)));
    };

    updateCellSize();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateCellSize);
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, [isExpanded, weeks.length, cellGap]);

  const activeDetailDay = hoveredDay || selectedDay;
  const availableSubjects: AvailableSubject[] = data?.available_subjects || [];

  const currentStreak = data?.current_streak ?? 0;
  const maxStreak = data?.max_streak ?? 0;

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

  // 1. Error State
  if (hasError && !data) {
    return (
      <div className="w-full bg-card rounded-3xl p-6 border border-rose-500/30 shadow-md mb-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 text-rose-500" />
            </div>
            <div className="text-left">
              <h3 className="text-base font-semibold text-foreground">
                Não foi possível carregar o histórico de estudos
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ocorreu uma falha na comunicação com o servidor.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => loadStats(true)}
            className="px-4 py-2 rounded-full bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition-colors cursor-pointer flex items-center gap-1.5"
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
      <div className="w-full bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-sm mb-12 animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-muted rounded-2xl" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-muted rounded-md" />
              <div className="h-4 w-72 bg-muted/70 rounded-md" />
            </div>
          </div>
          <div className="flex gap-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="w-9 h-9 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full bg-card rounded-3xl p-6 sm:p-7 border border-border tangerina-card space-y-6">
      {/* CANONICAL SPOTLIGHT ROW FROM TANGERINA-PREVIEW.HTML */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Fire Box + Streak Meta */}
        <div className="flex items-center gap-4 sm:gap-5 group/streak">
          <div className="relative w-14 h-14 sm:w-[60px] sm:h-[60px] rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-amber-500/15 border border-primary/30 text-primary text-2xl sm:text-[28px] flex items-center justify-center shrink-0 select-none overflow-hidden shadow-[0_4px_16px_rgba(255,112,32,0.15)]">
            <span className="absolute inset-1.5 rounded-xl bg-primary/20 blur-md animate-flame-halo pointer-events-none" />
            <span className="relative z-10 animate-flame-dance">🔥</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl sm:text-[22px] font-display font-semibold text-foreground tracking-[-0.02em] leading-tight">
              {currentStreak} {currentStreak === 1 ? "Dia Seguido de Foco" : "Dias Seguidos de Foco"}
            </h3>
            <p className="text-[13.5px] text-muted-foreground">
              Ritmo semanal consistente &bull; {formatDuration(weekSeconds)} de estudo acumulados nesta semana
              {maxStreak > 0 ? ` (Recorde: ${maxStreak} dias)` : ""}
            </p>
          </div>
        </div>

        {/* Right: Weekly Rhythm Squares + Expand Toggle */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {recentDays.map((day) => {
            const dObj = new Date(day.date + "T00:00:00");
            const dayOfWeek = (dObj.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
            const letter = DAY_LETTERS[dayOfWeek];
            const isToday = day.date === todayIso;

            // Tangerina active states: active-1, active-2, active-3
            const levelClass =
              day.level === 0
                ? "bg-secondary/70 text-muted-foreground border-border"
                : day.level === 1
                ? "bg-primary/20 text-primary font-bold border-primary/35"
                : day.level === 2
                ? "bg-primary/50 text-foreground font-bold border-primary/60"
                : "bg-primary text-[#030607] font-bold border-primary shadow-[0_0_10px_rgba(255,112,32,0.3)]";

            return (
              <div
                key={day.date}
                title={`${isToday ? "Hoje" : formatDateBr(day.date)}: ${formatDuration(day.study_seconds)}${
                  day.pomodoros > 0 ? ` (${day.pomodoros} pomodoros)` : ""
                }`}
                className={cn(
                  "h-9 sm:h-[38px] rounded-[10px] flex items-center justify-center text-[12px] font-semibold border transition-all duration-200 cursor-default select-none hover:-translate-y-0.5",
                  levelClass,
                  isToday
                    ? "px-3 min-w-[52px] ring-2 ring-primary ring-offset-2 ring-offset-card"
                    : "w-9 sm:w-[38px]"
                )}
              >
                {isToday ? "Hoje" : letter}
              </div>
            );
          })}

          {/* Toggle Button to Expand / Collapse Full 365-Day Matrix */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground hover:text-foreground px-3.5 py-2 rounded-full border border-border hover:border-primary/50 bg-secondary/60 hover:bg-secondary transition-all cursor-pointer ml-auto lg:ml-2"
          >
            <span>{isExpanded ? "Ocultar matriz anual" : "Ver matriz de 365 dias"}</span>
            <ChevronDown
              className={cn("w-3.5 h-3.5 transition-transform duration-200", isExpanded && "rotate-180")}
            />
          </button>
        </div>
      </div>

      {/* EXPANDABLE 365-DAY MATRIX DRAWER */}
      {isExpanded && (
        <div className="pt-6 border-t border-border space-y-4 animate-in fade-in duration-200">
          {/* Header Controls: Calendar icon & Subject Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <h4 className="text-sm font-display font-semibold text-foreground tracking-tight">
                Matriz Completa de Constância ({new Date().getFullYear()})
              </h4>
            </div>

            {availableSubjects.length > 0 && (
              <div className="relative max-w-[200px] self-start sm:self-center">
                <select
                  value={selectedSubjectId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedSubjectId(val === "" ? null : Number(val));
                  }}
                  className="w-full truncate appearance-none bg-muted/50 hover:bg-muted text-xs text-foreground border border-border rounded-xl pl-3 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium transition-colors"
                  aria-label="Filtrar heatmap por matéria"
                >
                  <option value="" className="bg-card text-foreground">
                    Todas as matérias
                  </option>
                  {availableSubjects.map((s) => (
                    <option key={s.id ?? -1} value={s.id ?? -1} className="bg-card text-foreground">
                      {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-2 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Full Heatmap Grid Scroller with fixed Day labels */}
          <div className="flex flex-col flex-1 min-w-0" ref={gridContainerRef}>
            <div className="flex items-start gap-1.5 w-full">
              {/* Day of Week Labels (Seg, Qua, Sex) */}
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
                    className="flex items-center justify-end text-[10px] text-muted-foreground font-sans leading-none"
                  >
                    {label || ""}
                  </div>
                ))}
              </div>

              {/* Scrollable Heatmap Grid */}
              <div
                ref={scrollContainerRef}
                className="overflow-x-auto overflow-y-hidden scrollbar-none [&::-webkit-scrollbar]:hidden flex-1 min-w-0 pt-1.5 pb-2.5 px-1.5"
              >
                <div className="inline-block min-w-max">
                  {/* Months Header Row */}
                  <div
                    className="flex mb-1.5 text-[11px] text-muted-foreground font-sans select-none"
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
                            <span className="font-medium text-muted-foreground whitespace-nowrap absolute left-0 top-0">
                              {labelObj.month}
                            </span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  {/* Weeks Columns: All columns strictly contain 7 squares */}
                  <div className="flex" style={{ gap: `${cellGap}px` }}>
                    {weeks.map((week, wIndex) => (
                      <div key={wIndex} className="flex flex-col" style={{ gap: `${cellGap}px` }}>
                        {week.map((day) => {
                          const isSelected = selectedDay?.date === day.date;
                          const isFuture = day.date > todayIso;

                          return (
                            <div
                              key={day.date}
                              tabIndex={0}
                              role="button"
                              aria-label={`Dia ${formatDateBr(day.date)}: ${
                                isFuture ? "A ser alcançado" : formatDuration(day.study_seconds)
                              }`}
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
                                "relative rounded-[3px] border transition-all duration-150 cursor-pointer focus:outline-none",
                                levelColors[day.level],
                                "hover:z-20 hover:ring-1 hover:ring-primary/80",
                                isSelected && "ring-2 ring-primary border-primary scale-110 z-30 shadow-lg"
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

            {/* Contextual Detail Bar below Heatmap */}
            <div className="min-h-[22px] flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
              {activeDetailDay ? (
                <span className="text-foreground font-normal flex items-center gap-1.5 flex-wrap">
                  <span className="text-foreground font-semibold tabular-nums">
                    {formatDateBr(activeDetailDay.date)}:
                  </span>{" "}
                  {activeDetailDay.date > todayIso ? (
                    <span className="text-muted-foreground italic">A ser alcançado</span>
                  ) : (
                    <>
                      <span className="font-medium text-foreground tabular-nums">
                        {formatDuration(activeDetailDay.study_seconds)}
                      </span>
                      {activeDetailDay.subjects && activeDetailDay.subjects.length > 0 ? (
                        <span className="text-muted-foreground">
                          · {activeDetailDay.subjects.map((s) => `${s.name} (${formatDuration(s.seconds)})`).join(", ")}
                        </span>
                      ) : activeDetailDay.courses && activeDetailDay.courses.length > 0 ? (
                        <span className="text-muted-foreground">
                          · {activeDetailDay.courses.map((c) => c.name).join(", ")}
                        </span>
                      ) : activeDetailDay.study_seconds > 0 ? (
                        <span className="text-muted-foreground">· Atividade geral</span>
                      ) : (
                        <span className="text-muted-foreground/60">· Sem registros</span>
                      )}
                      {activeDetailDay.pomodoros > 0 && (
                        <span className="text-muted-foreground tabular-nums">
                          • {activeDetailDay.pomodoros} {activeDetailDay.pomodoros === 1 ? "pomodoro" : "pomodoros"}
                        </span>
                      )}
                      {activeDetailDay.lessons > 0 && (
                        <span className="text-muted-foreground tabular-nums">
                          • {activeDetailDay.lessons} {activeDetailDay.lessons === 1 ? "aula concluída" : "aulas concluídas"}
                        </span>
                      )}
                    </>
                  )}
                  {selectedDay?.date === activeDetailDay.date && (
                    <button
                      type="button"
                      onClick={() => setSelectedDay(null)}
                      className="ml-2 text-[10px] text-muted-foreground hover:text-foreground underline cursor-pointer"
                    >
                      (Limpar seleção)
                    </button>
                  )}
                </span>
              ) : (
                <span className="text-muted-foreground/70 text-[11px]">
                  Passe o mouse ou toque em qualquer dia para ver os detalhes
                </span>
              )}

              {/* Heatmap Legend */}
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground select-none shrink-0 ml-auto">
                <span>Menos</span>
                <div className="flex items-center gap-1">
                  {levelColors.map((cls, idx) => (
                    <div key={idx} className={cn("w-3 h-3 rounded-[2.5px] border", cls)} />
                  ))}
                </div>
                <span>Mais</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
