import { useMemo } from "react";
import { StudyEvent, EventCategory, CATEGORY_CONFIGS } from "@/models/event";
import { HeatmapDay } from "@/services/statsApi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarMonthGridProps {
  currentDate: Date;
  onChangeMonth: (nextDate: Date) => void;
  events: StudyEvent[];
  heatmapDays?: HeatmapDay[];
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

        {/* Modern Segmented Category Filter Toolbar (Icon-free) */}
        <div className="p-1 bg-secondary/50 border border-border/80 rounded-2xl flex items-center gap-1 overflow-x-auto shadow-inner">
          <button
            type="button"
            onClick={() => onChangeCategoryFilter("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer select-none shrink-0",
              categoryFilter === "all"
                ? "bg-card text-foreground font-semibold shadow-sm border border-border/80 ring-1 ring-black/5 dark:ring-white/5"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
          >
            <span>Todas</span>
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
                  "px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer select-none shrink-0",
                  isSelected
                    ? "bg-card text-foreground font-semibold shadow-sm border border-border/80 ring-1 ring-black/5 dark:ring-white/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: conf.color }}
                />
                <span>{conf.label}</span>
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
              {/* Day header: Day number */}
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
              </div>

              {/* Event Chips List (Solid Tangerina Blocks for Active / Quiet Muted for Done) */}
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
                      style={
                        !event.done
                          ? {
                              backgroundColor: conf.solidBg,
                              color: conf.solidText,
                            }
                          : undefined
                      }
                      className={cn(
                        "px-2 py-0.5 rounded-lg text-[10.5px] flex items-center justify-between gap-1.5 transition-all cursor-pointer",
                        event.done
                          ? "bg-secondary/50 text-muted-foreground font-medium line-through opacity-55 hover:opacity-80"
                          : "font-semibold shadow-xs hover:brightness-105 active:scale-[0.99]"
                      )}
                      title={`${event.title}${event.time ? ` às ${event.time}` : ""}`}
                    >
                      <span className="truncate leading-snug">{event.title}</span>
                      {event.time && (
                        <span className="font-mono text-[9.5px] opacity-85 shrink-0 tabular-nums">
                          {event.time}
                        </span>
                      )}
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
