import { useMemo } from "react";
import { StudyEvent, EventCategory, CATEGORY_CONFIGS } from "@/models/event";
import { HeatmapDay } from "@/services/statsApi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

interface CalendarMonthGridProps {
  currentDate: Date;
  onChangeMonth: (nextDate: Date) => void;
  events: StudyEvent[];
  heatmapDays: HeatmapDay[];
  categoryFilter: EventCategory | "all";
  onChangeCategoryFilter: (cat: EventCategory | "all") => void;
  onSelectDate: (dateStr: string) => void;
  onEditEvent: (event: StudyEvent) => void;
}

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface DayCell {
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export default function CalendarMonthGrid({
  currentDate,
  onChangeMonth,
  events,
  heatmapDays,
  categoryFilter,
  onChangeCategoryFilter,
  onSelectDate,
  onEditEvent,
}: CalendarMonthGridProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  }, []);

  // Map of dateStr -> HeatmapDay for study indicators
  const studyMap = useMemo(() => {
    const map = new Map<string, HeatmapDay>();
    heatmapDays.forEach((d) => map.set(d.date, d));
    return map;
  }, [heatmapDays]);

  // Filter events by category
  const filteredEvents = useMemo(() => {
    if (categoryFilter === "all") return events;
    return events.filter((e) => e.category === categoryFilter);
  }, [events, categoryFilter]);

  // Group events by dateStr
  const eventsByDate = useMemo(() => {
    const map = new Map<string, StudyEvent[]>();
    filteredEvents.forEach((e) => {
      const list = map.get(e.date) || [];
      list.push(e);
      map.set(e.date, list);
    });
    return map;
  }, [filteredEvents]);

  // Build calendar matrix (42 cells: 6 rows x 7 cols)
  const cells = useMemo(() => {
    const result: DayCell[] = [];
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 (Dom) to 6 (Sáb)
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(
        dayNum
      ).padStart(2, "0")}`;
      result.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      result.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding to fill out to 35 or 42 cells
    const remaining = (7 - (result.length % 7)) % 7;
    const totalNeeded = result.length + remaining < 35 ? 35 : result.length + remaining;
    const extra = totalNeeded - result.length;

    for (let day = 1; day <= extra; day++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      result.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return result;
  }, [year, month, todayStr]);

  const handlePrevMonth = () => {
    onChangeMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    onChangeMonth(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    onChangeMonth(new Date());
  };

  return (
    <div className="w-full bg-card rounded-3xl p-5 sm:p-6 border border-border tangerina-card space-y-5">
      {/* Top Bar: Month navigation + Category filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        {/* Navigation */}
        <div className="flex items-center gap-3">
          <h2 className="text-lg sm:text-xl font-display font-semibold text-foreground tracking-[-0.015em] min-w-[180px]">
            {MONTH_NAMES[month]} de {year}
          </h2>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-xl bg-secondary/60 border-border hover:bg-secondary text-muted-foreground hover:text-foreground"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="h-8 px-3 text-xs rounded-xl bg-secondary/60 border-border hover:bg-secondary text-foreground font-medium"
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-xl bg-secondary/60 border-border hover:bg-secondary text-muted-foreground hover:text-foreground"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChangeCategoryFilter("all")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer",
              categoryFilter === "all"
                ? "bg-primary text-[#030607] border-primary font-semibold shadow-sm"
                : "bg-secondary/60 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            Todas
          </button>

          {(Object.keys(CATEGORY_CONFIGS) as EventCategory[]).map((cat) => {
            const conf = CATEGORY_CONFIGS[cat];
            const isSelected = categoryFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onChangeCategoryFilter(cat)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer",
                  conf.bgClass,
                  conf.borderClass,
                  conf.textClass,
                  isSelected
                    ? "ring-2 ring-primary/40 font-semibold scale-[1.02]"
                    : "opacity-75 hover:opacity-100"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", conf.dotClass)} />
                {conf.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground pb-1">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Month Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {cells.map((cell) => {
          const dayEvents = eventsByDate.get(cell.dateStr) || [];
          const studyInfo = studyMap.get(cell.dateStr);
          const studiedSeconds = studyInfo?.study_seconds || 0;
          const hasStudied = studiedSeconds > 0;

          return (
            <div
              key={cell.dateStr}
              onClick={() => onSelectDate(cell.dateStr)}
              className={cn(
                "min-h-[70px] sm:min-h-[82px] lg:min-h-[86px] xl:min-h-[96px] p-1.5 sm:p-2 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer group",
                cell.isCurrentMonth
                  ? "bg-secondary/25 hover:bg-secondary/60 border-border"
                  : "bg-muted/20 border-border/50 opacity-45 hover:opacity-75",
                cell.isToday && "ring-2 ring-primary/45 border-primary bg-primary/[0.06]"
              )}
            >
              {/* Day header: Day number + Study Indicator */}
              <div className="flex items-center justify-between gap-1 w-full">
                <span
                  className={cn(
                    "text-xs font-mono tabular-nums leading-none",
                    cell.isToday
                      ? "px-1.5 py-0.5 rounded-md bg-primary text-[#030607] font-bold shadow-sm"
                      : cell.isCurrentMonth
                      ? "text-foreground/85 font-medium group-hover:text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {cell.dayNumber}
                </span>

                {/* Subtle Study indicator badge */}
                {hasStudied && (
                  <span
                    className="inline-flex items-center gap-1 text-[9px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/25 font-medium"
                    title={`Estudo registrado: ${Math.round(studiedSeconds / 60)} min`}
                  >
                    <BookOpen className="w-2.5 h-2.5 text-primary shrink-0" />
                    <span className="hidden sm:inline">
                      {Math.round(studiedSeconds / 60)}m
                    </span>
                  </span>
                )}
              </div>

              {/* Event Chips List */}
              <div className="space-y-1 w-full mt-1.5 flex-1 overflow-hidden">
                {dayEvents.slice(0, 3).map((event) => {
                  const conf =
                    CATEGORY_CONFIGS[event.category] || CATEGORY_CONFIGS.lembrete;
                  return (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditEvent(event);
                      }}
                      className={cn(
                        "px-1.5 py-0.5 rounded-md text-[10px] font-medium border truncate transition-all block text-left cursor-pointer",
                        conf.bgClass,
                        conf.borderClass,
                        conf.textClass,
                        event.done && "line-through opacity-50 text-muted-foreground"
                      )}
                      title={`${event.title}${event.time ? ` às ${event.time}` : ""}`}
                    >
                      {event.subject_color && (
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full mr-1 shrink-0 align-middle"
                          style={{ backgroundColor: event.subject_color }}
                        />
                      )}
                      {event.time && (
                        <span className="font-mono mr-1 opacity-80">{event.time}</span>
                      )}
                      {event.title}
                    </div>
                  );
                })}

                {dayEvents.length > 3 && (
                  <div className="text-[9px] text-muted-foreground font-mono text-center">
                    +{dayEvents.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
