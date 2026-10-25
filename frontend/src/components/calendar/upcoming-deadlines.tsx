import { useMemo } from "react";
import { StudyEvent, CATEGORY_CONFIGS } from "@/models/event";
import { Course } from "@/models/models";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Plus,
  BookOpen,
} from "lucide-react";

interface UpcomingDeadlinesProps {
  events: StudyEvent[];
  courses: Course[];
  onToggleDone: (id: number) => Promise<void>;
  onEdit: (event: StudyEvent) => void;
  onNewEvent: () => void;
  onExportIcs: () => void;
  isExporting?: boolean;
}

function getDaysDiff(targetDateStr: string): number {
  const [year, month, day] = targetDateStr.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

function formatCountdown(diffDays: number): { text: string; urgent: boolean } {
  if (diffDays < 0) {
    const days = Math.abs(diffDays);
    return { text: `Atrasado há ${days} ${days === 1 ? "dia" : "dias"}`, urgent: true };
  }
  if (diffDays === 0) {
    return { text: "Hoje", urgent: true };
  }
  if (diffDays === 1) {
    return { text: "Amanhã", urgent: true };
  }
  if (diffDays <= 7) {
    return { text: `em ${diffDays} dias`, urgent: true };
  }
  return { text: `em ${diffDays} dias`, urgent: false };
}

export default function UpcomingDeadlines({
  events,
  courses,
  onToggleDone,
  onEdit,
  onNewEvent,
  onExportIcs,
  isExporting,
}: UpcomingDeadlinesProps) {
  // Filter uncompleted events and sort by date ascending
  const upcomingList = useMemo(() => {
    return events
      .filter((ev) => !ev.done)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.time || "23:59").localeCompare(b.time || "23:59");
      });
  }, [events]);

  const coursesMap = useMemo(() => {
    const map = new Map<number, Course>();
    courses.forEach((c) => map.set(c.id, c));
    return map;
  }, [courses]);

  return (
    <div className="w-full glass-panel rounded-2xl p-5 border border-white/10 shadow-xl space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-white tracking-tight">
            Próximos prazos
          </h2>
          <span className="text-[11px] font-mono tabular-nums px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
            {upcomingList.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onExportIcs}
            disabled={isExporting}
            className="h-8 px-2.5 text-xs text-zinc-300 hover:text-white hover:bg-white/10 gap-1.5"
            title="Exportar calendário em formato .ics para Google Calendar, Apple Calendar ou Outlook"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Exportar .ics</span>
          </Button>

          <Button
            size="sm"
            onClick={onNewEvent}
            className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo</span>
          </Button>
        </div>
      </div>

      {upcomingList.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <p className="text-xs text-zinc-400">Nenhum prazo pendente no momento.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={onNewEvent}
            className="text-xs bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300"
          >
            Agendar primeiro prazo
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
          {upcomingList.map((event) => {
            const conf = CATEGORY_CONFIGS[event.category] || CATEGORY_CONFIGS.lembrete;
            const diffDays = getDaysDiff(event.date);
            const countdown = formatCountdown(diffDays);
            const course = event.course_id ? coursesMap.get(event.course_id) : null;

            return (
              <div
                key={event.id}
                className={cn(
                  "p-3 rounded-xl border transition-all duration-200 group relative",
                  "bg-white/[0.03] hover:bg-white/[0.07] border-white/10"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    {/* Botão de toggle done */}
                    <button
                      type="button"
                      onClick={() => onToggleDone(event.id)}
                      className="mt-0.5 text-zinc-500 hover:text-emerald-400 transition-colors shrink-0 cursor-pointer"
                      title="Marcar como concluído"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    <div
                      className="space-y-1 min-w-0 flex-1 cursor-pointer"
                      onClick={() => onEdit(event)}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-medium border inline-flex items-center gap-1",
                            conf.bgClass,
                            conf.borderClass,
                            conf.textClass
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full", conf.dotClass)} />
                          {conf.label}
                        </span>

                        <span
                          className={cn(
                            "text-[10px] font-mono tabular-nums px-2 py-0.5 rounded-full border",
                            countdown.urgent
                              ? "bg-rose-500/10 border-rose-500/25 text-rose-300"
                              : "bg-white/5 border-white/10 text-zinc-400"
                          )}
                        >
                          {countdown.text}
                        </span>

                        {event.time && (
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                            <Clock className="w-2.5 h-2.5" />
                            {event.time}
                          </span>
                        )}
                      </div>

                      <h3
                        className="text-xs font-medium text-white truncate group-hover:text-blue-300 transition-colors"
                        title={event.title}
                      >
                        {event.title}
                      </h3>

                      {course && (
                        <div className="flex items-center gap-1 text-[11px] text-zinc-400 truncate">
                          <BookOpen className="w-3 h-3 text-zinc-500 shrink-0" />
                          <span className="truncate">{course.name}</span>
                        </div>
                      )}

                      {event.notes && (
                        <p className="text-[11px] text-zinc-400 line-clamp-1 italic">
                          {event.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Data formatada à direita */}
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-mono tabular-nums text-zinc-400 block">
                      {event.date.split("-").slice(1).reverse().join("/")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
