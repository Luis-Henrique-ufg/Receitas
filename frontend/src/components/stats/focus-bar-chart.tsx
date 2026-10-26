import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Target,
  Clock,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import {
  statsApi,
  FocusBarsResponse,
  FocusBar,
} from "@/services/statsApi";
import useApiUrl from "@/hooks/useApiUrl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type PeriodType = "day" | "week" | "month" | "year";

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes} min`;
}

function formatAxisHours(seconds: number): string {
  const hours = seconds / 3600;
  if (hours === 0) return "0h";
  if (Number.isInteger(hours)) return `${hours}h`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h${m.toString().padStart(2, "0")}`;
}

export default function FocusBarChart() {
  const { apiUrl } = useApiUrl();
  const [period, setPeriod] = useState<PeriodType>("day");
  const [offset, setOffset] = useState<number>(0);
  const [dayLimit, setDayLimit] = useState<14 | 30>(14);
  const [data, setData] = useState<FocusBarsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredBar, setHoveredBar] = useState<FocusBar | null>(null);

  // Hidden subjects set for interactive legend (toggle on/off)
  // Value stored as string: "id" or "none"
  const [hiddenSubjects, setHiddenSubjects] = useState<Set<string>>(new Set());

  // Goal (in seconds): Default 2h (7200s) for day, 10h (36000s) for week, 40h for month
  const defaultGoals: Record<PeriodType, number> = {
    day: 2 * 3600,
    week: 10 * 3600,
    month: 40 * 3600,
    year: 400 * 3600,
  };
  const [showGoalLine, setShowGoalLine] = useState<boolean>(true);

  const goalSeconds = defaultGoals[period];

  const fetchData = useCallback(
    async (showLoading = false) => {
      try {
        if (showLoading) setIsLoading(true);
        const limitParam = period === "day" ? dayLimit : undefined;
        const res = await statsApi.getFocusBars(apiUrl, period, offset, limitParam);
        setData(res);
      } catch (err) {
        console.error("Erro ao carregar dados do gráfico de foco:", err);
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [apiUrl, period, offset, dayLimit]
  );

  useEffect(() => {
    fetchData(true);

    const handleUpdate = () => {
      void fetchData(false);
    };

    window.addEventListener("statsUpdated", handleUpdate);
    window.addEventListener("subjectsUpdated", handleUpdate);
    return () => {
      window.removeEventListener("statsUpdated", handleUpdate);
      window.removeEventListener("subjectsUpdated", handleUpdate);
    };
  }, [fetchData]);

  // Reset offset when changing period
  function handlePeriodChange(newPeriod: PeriodType) {
    if (newPeriod !== period) {
      setPeriod(newPeriod);
      setOffset(0);
      setHoveredBar(null);
    }
  }

  // Toggle subject visibility from legend
  function toggleSubjectVisibility(subjectKey: string) {
    setHiddenSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(subjectKey)) {
        next.delete(subjectKey);
      } else {
        next.add(subjectKey);
      }
      return next;
    });
  }

  // Filtered bars according to visible subjects
  const { filteredBars, maxSeconds, visibleTotalSeconds } = useMemo(() => {
    if (!data?.bars) {
      return { filteredBars: [], maxSeconds: 3600, visibleTotalSeconds: 0 };
    }

    let highest = 0;
    let sumVisible = 0;

    const computed = data.bars.map((bar) => {
      // Filter breakdown to exclude hidden subjects
      const activeBreakdown = bar.breakdown.filter((item) => {
        const key = item.subject_id === null ? "none" : String(item.subject_id);
        return !hiddenSubjects.has(key);
      });

      const total = activeBreakdown.reduce((acc, curr) => acc + curr.seconds, 0);
      const totalPomodoros = activeBreakdown.reduce(
        (acc, curr) => acc + curr.pomodoros,
        0
      );
      if (total > highest) highest = total;
      sumVisible += total;

      return {
        ...bar,
        total_seconds: total,
        total_pomodoros: totalPomodoros,
        breakdown: activeBreakdown,
      };
    });

    // Ensure ceiling considers goal line so goal line doesn't overflow
    const effectiveCeiling = Math.max(highest, showGoalLine ? goalSeconds : 0);
    // Round ceiling up to nearest 1h or 2h step
    const step = effectiveCeiling > 14400 ? 7200 : 3600;
    const roundedMax = Math.max(step * 2, Math.ceil(effectiveCeiling / step) * step);

    return {
      filteredBars: computed,
      maxSeconds: roundedMax,
      visibleTotalSeconds: sumVisible,
    };
  }, [data?.bars, hiddenSubjects, showGoalLine, goalSeconds]);

  // Y-Axis tick intervals (4 to 5 ticks)
  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const count = 4;
    const step = maxSeconds / count;
    for (let i = 0; i <= count; i++) {
      ticks.push(Math.round(i * step));
    }
    return ticks;
  }, [maxSeconds]);

  // SVG Chart Geometry
  const barCount = filteredBars.length;
  const isDense = barCount >= 20;
  const svgWidth = isDense ? 960 : 840;
  const svgHeight = 240;
  const paddingLeft = isDense ? 45 : 50;
  const paddingRight = isDense ? 15 : 20;
  const paddingTop = 25;
  const paddingBottom = 42;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const slotWidth = barCount > 0 ? plotWidth / barCount : plotWidth;
  const barWidth = Math.max(6, Math.min(36, slotWidth * (isDense ? 0.72 : 0.65)));

  const goalY =
    showGoalLine && goalSeconds <= maxSeconds
      ? paddingTop + plotHeight - (goalSeconds / maxSeconds) * plotHeight
      : null;

  return (
    <div className="w-full glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
      {/* Top Header: Title, Total, Period Segmented Buttons, Time Navigator */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-blue-500/30 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-heading font-semibold text-white tracking-tight">
                Tempo de foco
              </h2>
              <span className="text-xs font-mono font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full tabular-nums">
                {formatDuration(visibleTotalSeconds)}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 font-sans">
              Distribuição de horas estudadas por matéria via sessões de Pomodoro
            </p>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Day count switcher (14 vs 30 days) if in day mode */}
          {period === "day" && (
            <div className="inline-flex items-center p-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setDayLimit(14)}
                className={cn(
                  "px-2 py-1 rounded-md transition-all font-medium",
                  dayLimit === 14
                    ? "bg-blue-600/30 text-white border border-blue-500/30 font-semibold"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                14d
              </button>
              <button
                type="button"
                onClick={() => setDayLimit(30)}
                className={cn(
                  "px-2 py-1 rounded-md transition-all font-medium",
                  dayLimit === 30
                    ? "bg-blue-600/30 text-white border border-blue-500/30 font-semibold"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                30d
              </button>
            </div>
          )}

          {/* Period Selector (Dia | Sem | Mês | Ano) */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs">
            {(["day", "week", "month", "year"] as PeriodType[]).map((p) => {
              const labelMap: Record<PeriodType, string> = {
                day: "Dia",
                week: "Sem",
                month: "Mês",
                year: "Ano",
              };
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePeriodChange(p)}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all font-medium",
                    period === p
                      ? "bg-blue-600/30 text-white border border-blue-500/30 font-semibold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  {labelMap[p]}
                </button>
              );
            })}
          </div>

          {/* Time Navigator (< Range Label >) */}
          <div className="flex items-center gap-1 bg-white/[0.04] border border-white/10 rounded-lg p-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOffset((prev) => prev - 1)}
              title="Período Anterior"
              className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <span className="text-xs font-medium text-zinc-200 px-2 min-w-[130px] text-center truncate">
              {data?.range_label || "Carregando..."}
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOffset((prev) => prev + 1)}
              disabled={offset >= 0}
              title="Próximo Período"
              className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Reset offset button if not current period */}
          {offset !== 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOffset(0)}
              title="Voltar ao período atual"
              className="h-7 w-7 text-zinc-400 hover:text-cyan-400 hover:bg-white/10"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          )}

          {/* Toggle Goal Line */}
          <button
            type="button"
            onClick={() => setShowGoalLine(!showGoalLine)}
            title={showGoalLine ? "Ocultar linha de meta" : "Exibir linha de meta"}
            className={cn(
              "p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1",
              showGoalLine
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : "bg-white/[0.02] border-white/10 text-zinc-400 hover:text-white"
            )}
          >
            <Target className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Meta</span>
          </button>
        </div>
      </div>

      {/* Main Bar Chart Section */}
      <div className="pt-4 relative">
        {isLoading && !data ? (
          <div className="h-60 rounded-xl bg-white/[0.02] animate-pulse flex items-center justify-center border border-white/5">
            <span className="text-xs text-zinc-500">Carregando dados de foco...</span>
          </div>
        ) : (
          <div className="w-full overflow-x-auto select-none">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className={cn(
                "w-full h-auto overflow-visible",
                isDense ? "min-w-[720px]" : "min-w-[620px]"
              )}
            >
              {/* Horizontal Gridlines & Y-Axis Labels */}
              {yTicks.map((tickVal) => {
                const y = paddingTop + plotHeight - (tickVal / maxSeconds) * plotHeight;
                return (
                  <g key={tickVal} className="text-zinc-500">
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={svgWidth - paddingRight}
                      y2={y}
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      className="text-[10px] fill-zinc-400 font-mono font-medium select-none"
                    >
                      {formatAxisHours(tickVal)}
                    </text>
                  </g>
                );
              })}

              {/* Goal Line */}
              {goalY !== null && (
                <g>
                  <line
                    x1={paddingLeft}
                    y1={goalY}
                    x2={svgWidth - paddingRight}
                    y2={goalY}
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeDasharray="5 4"
                    opacity="0.8"
                  />
                  <text
                    x={svgWidth - paddingRight - 4}
                    y={goalY - 5}
                    textAnchor="end"
                    className="text-[10px] fill-amber-400 font-sans font-medium"
                  >
                    Meta: {formatDuration(goalSeconds)}
                  </text>
                </g>
              )}

              {/* Stacked Bars */}
              {filteredBars.map((bar, index) => {
                const slotX = paddingLeft + index * slotWidth;
                const barX = slotX + (slotWidth - barWidth) / 2;
                const isHovered = hoveredBar?.key === bar.key;

                // Stack segments from bottom up
                let currentY = paddingTop + plotHeight;

                return (
                  <g
                    key={bar.key}
                    onMouseEnter={() => setHoveredBar(bar)}
                    onMouseLeave={() => setHoveredBar(null)}
                    className="cursor-pointer group"
                  >
                    {/* Background hit area */}
                    <rect
                      x={slotX}
                      y={paddingTop}
                      width={slotWidth}
                      height={plotHeight + paddingBottom}
                      fill="transparent"
                      className="group-hover:fill-white/[0.02] transition-colors"
                    />

                    {/* Stack segments */}
                    {bar.breakdown.map((item, itemIdx) => {
                      const segHeight = (item.seconds / maxSeconds) * plotHeight;
                      currentY -= segHeight;
                      const isTopSegment = itemIdx === bar.breakdown.length - 1;

                      return (
                        <rect
                          key={`${bar.key}-${item.subject_id ?? "none"}`}
                          x={barX}
                          y={currentY}
                          width={barWidth}
                          height={Math.max(0, segHeight)}
                          fill={item.color || "#64748b"}
                          rx={isTopSegment ? 4 : 0}
                          className={cn(
                            "transition-all duration-200",
                            isHovered
                              ? "brightness-125 filter drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]"
                              : "opacity-95"
                          )}
                        />
                      );
                    })}

                    {/* Empty state pill/dot if bar has 0 seconds */}
                    {bar.total_seconds === 0 && (
                      <rect
                        x={barX + barWidth / 2 - 2}
                        y={paddingTop + plotHeight - 3}
                        width={4}
                        height={3}
                        rx={1.5}
                        fill="rgba(255, 255, 255, 0.15)"
                      />
                    )}

                    {/* X-Axis Bar Label */}
                    {(() => {
                      // In dense view (e.g. 30 days), showing "26 Out" in every 30px slot causes overlap.
                      // Instead, display only the day number (e.g. "26") or "1 Out" on the 1st of month.
                      let labelText = bar.label;
                      let isMonthMarker = false;

                      if (slotWidth < 38) {
                        const dayNum = bar.start_date
                          ? parseInt(bar.start_date.split("-")[2], 10)
                          : parseInt(bar.label.split(" ")[0], 10);
                        const isFirst = index === 0;
                        const isFirstOfMonth = dayNum === 1;

                        if (isFirst || isFirstOfMonth) {
                          isMonthMarker = true;
                          labelText = bar.label;
                        } else {
                          labelText = String(dayNum);
                        }
                      }

                      return (
                        <text
                          x={slotX + slotWidth / 2}
                          y={paddingTop + plotHeight + 16}
                          textAnchor="middle"
                          className={cn(
                            "text-[10px] font-sans transition-colors tabular-nums",
                            isHovered
                              ? "fill-white font-bold"
                              : isMonthMarker
                              ? "fill-cyan-400 font-semibold"
                              : "fill-zinc-400 font-medium"
                          )}
                        >
                          {labelText}
                        </text>
                      );
                    })()}

                    {/* X-Axis Sublabel (e.g. Day name) */}
                    {bar.sublabel && (
                      <text
                        x={slotX + slotWidth / 2}
                        y={paddingTop + plotHeight + 28}
                        textAnchor="middle"
                        className={cn(
                          "font-sans transition-colors",
                          slotWidth < 32
                            ? "text-[8.5px] fill-zinc-500 font-medium"
                            : "text-[9px] fill-zinc-500",
                          isHovered && "fill-zinc-300 font-semibold"
                        )}
                      >
                        {slotWidth < 32 ? bar.sublabel.charAt(0) : bar.sublabel}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* Hovered Bar Interactive Popover / Tooltip */}
        <div className="min-h-[44px] mt-2 p-2.5 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-between text-xs text-zinc-300">
          {hoveredBar ? (
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">
                  {hoveredBar.label} {hoveredBar.sublabel ? `(${hoveredBar.sublabel})` : ""}:
                </span>
                <span className="font-mono font-bold text-cyan-400 tabular-nums">
                  {formatDuration(hoveredBar.total_seconds)}
                </span>
                {hoveredBar.total_pomodoros > 0 && (
                  <span className="text-rose-300 tabular-nums">
                    • {hoveredBar.total_pomodoros}{" "}
                    {hoveredBar.total_pomodoros === 1 ? "pomodoro" : "pomodoros"}
                  </span>
                )}
              </div>

              {/* Subject Breakdown list */}
              <div className="flex flex-wrap items-center gap-3">
                {hoveredBar.breakdown.length > 0 ? (
                  hoveredBar.breakdown.map((item) => (
                    <div
                      key={item.subject_id ?? "none"}
                      className="flex items-center gap-1.5"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-zinc-200">{item.name}:</span>
                      <span className="font-mono font-medium text-white tabular-nums">
                        {formatDuration(item.seconds)}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-zinc-500 italic">Sem registros neste intervalo</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-zinc-400 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>
                Passe o cursor sobre as barras para ver os detalhes discriminados por matéria.
              </span>
            </div>
          )}
        </div>

        {/* Interactive Legend: Click to toggle subject visibility */}
        {data?.subjects && data.subjects.length > 0 && (
          <div className="pt-3 border-t border-white/10 mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-zinc-400 mr-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Matérias:
            </span>
            {data.subjects.map((sub) => {
              const key = sub.id === null ? "none" : String(sub.id);
              const isHidden = hiddenSubjects.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSubjectVisibility(key)}
                  title={
                    isHidden
                      ? `Clique para exibir ${sub.name}`
                      : `Clique para ocultar ${sub.name}`
                  }
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer",
                    isHidden
                      ? "bg-white/[0.02] border-white/10 text-zinc-500 line-through opacity-50"
                      : "bg-white/[0.05] border-white/20 text-zinc-200 hover:border-white/30"
                  )}
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      isHidden && "grayscale"
                    )}
                    style={{ backgroundColor: sub.color }}
                  />
                  <span>{sub.name}</span>
                  {sub.study_seconds > 0 && (
                    <span className="text-[10px] font-mono text-zinc-400 tabular-nums">
                      ({formatDuration(sub.study_seconds)})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
