import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useApiUrl from "@/hooks/useApiUrl";
import { eventsApi } from "@/services/eventsApi";
import { StudyEvent, CATEGORY_CONFIGS } from "@/models/event";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar, ChevronRight, BookOpen, Clock, Plus } from "lucide-react";

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
    return { text: `Atrasado há ${days}d`, urgent: true };
  }
  if (diffDays === 0) return { text: "Hoje", urgent: true };
  if (diffDays === 1) return { text: "Amanhã", urgent: true };
  if (diffDays <= 7) return { text: `em ${diffDays} dias`, urgent: true };
  return { text: `em ${diffDays} dias`, urgent: false };
}

export default function DashboardDeadlinesWidget() {
  const { apiUrl } = useApiUrl();
  const navigate = useNavigate();
  const [upcomingEvents, setUpcomingEvents] = useState<StudyEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUpcoming() {
      try {
        setIsLoading(true);
        const data = await eventsApi.getAll(apiUrl, {
          upcoming: 3,
          include_done: false,
        });
        setUpcomingEvents(data);
      } catch (err) {
        console.error("Erro ao carregar prazos no dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadUpcoming();
  }, [apiUrl]);

  return (
    <div className="w-full glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 shadow-lg space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-white tracking-tight">
            Próximos prazos
          </h2>
          {upcomingEvents.length > 0 && (
            <span className="text-[11px] font-mono tabular-nums px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
              {upcomingEvents.length}
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/agenda")}
          className="h-8 px-2.5 text-xs text-zinc-300 hover:text-white hover:bg-white/10 gap-1 font-medium"
        >
          <span>Ver agenda completa</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-white/5 animate-pulse border border-white/5"
            />
          ))}
        </div>
      ) : upcomingEvents.length === 0 ? (
        <div className="flex flex-col sm:flex-row items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 gap-3">
          <p className="text-xs text-zinc-400">
            Nenhum prazo agendado para os próximos dias.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/agenda")}
            className="h-8 text-xs bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300 gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar evento</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {upcomingEvents.map((ev) => {
            const conf = CATEGORY_CONFIGS[ev.category] || CATEGORY_CONFIGS.lembrete;
            const diffDays = getDaysDiff(ev.date);
            const countdown = formatCountdown(diffDays);

            return (
              <div
                key={ev.id}
                onClick={() => navigate("/agenda")}
                className="p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.07] transition-all cursor-pointer space-y-1.5 group"
              >
                <div className="flex items-center justify-between gap-1.5">
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
                </div>

                <h3
                  className="text-xs font-semibold text-white truncate group-hover:text-blue-300 transition-colors"
                  title={ev.title}
                >
                  {ev.title}
                </h3>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 gap-1">
                  {ev.course_name ? (
                    <span className="flex items-center gap-1 truncate text-zinc-400">
                      <BookOpen className="w-3 h-3 text-zinc-500 shrink-0" />
                      <span className="truncate">{ev.course_name}</span>
                    </span>
                  ) : (
                    <span className="text-zinc-500 text-[10px]">Evento avulso</span>
                  )}

                  {ev.time && (
                    <span className="text-[10px] font-mono shrink-0 flex items-center gap-0.5 text-zinc-400">
                      <Clock className="w-2.5 h-2.5" />
                      {ev.time}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
