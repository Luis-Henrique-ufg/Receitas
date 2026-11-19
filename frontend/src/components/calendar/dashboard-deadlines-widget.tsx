import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useApiUrl from "@/hooks/useApiUrl";
import { eventsApi } from "@/services/eventsApi";
import { StudyEvent, CATEGORY_CONFIGS } from "@/models/event";
import { Button } from "@/components/ui/button";
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
    <div className="w-full bg-card rounded-3xl p-6 sm:p-7 border border-border tangerina-card space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-base sm:text-lg font-display font-semibold text-foreground tracking-[-0.01em]">
            Próximos prazos
          </h2>
          {upcomingEvents.length > 0 && (
            <span className="text-[11px] font-mono tabular-nums px-2.5 py-0.5 rounded-full bg-primary/12 border border-primary/25 text-primary font-semibold">
              {upcomingEvents.length}
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/agenda")}
          className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary gap-1 font-medium rounded-full"
        >
          <span>Ver agenda completa</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-secondary/50 animate-pulse border border-border"
            />
          ))}
        </div>
      ) : upcomingEvents.length === 0 ? (
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-secondary/35 border border-border gap-3">
          <p className="text-xs text-muted-foreground">
            Nenhum prazo agendado para os próximos dias.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/agenda")}
            className="h-8 text-xs bg-card border-border hover:bg-secondary text-foreground gap-1.5 rounded-full"
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
            <span>Adicionar evento</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {upcomingEvents.map((ev) => {
            const conf = CATEGORY_CONFIGS[ev.category] || CATEGORY_CONFIGS.lembrete;
            const diffDays = getDaysDiff(ev.date);
            const countdown = formatCountdown(diffDays);

            return (
              <div
                key={ev.id}
                onClick={() => navigate("/agenda")}
                className="p-4 pl-4.5 rounded-2xl border border-border bg-secondary/35 hover:bg-secondary/70 hover:border-primary/40 transition-all cursor-pointer space-y-2 group shadow-xs relative overflow-hidden"
              >
                <span
                  className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
                  style={{ backgroundColor: conf.color }}
                />

                <div className="flex items-center justify-between gap-1.5">
                  <span
                    style={{
                      backgroundColor: conf.solidBg,
                      color: conf.solidText,
                    }}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-[0.05em] leading-tight"
                  >
                    {conf.label}
                  </span>

                  <span className="text-[10px] font-mono tabular-nums px-2 py-0.5 rounded-md border border-border bg-card/80 text-foreground/85 inline-flex items-center gap-1.5">
                    {countdown.urgent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                    )}
                    {countdown.text}
                  </span>
                </div>

                <h3
                  className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors"
                  title={ev.title}
                >
                  {ev.title}
                </h3>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground gap-1 pt-1 border-t border-border/50">
                  {ev.subject_name || ev.course_name ? (
                    <span className="flex items-center gap-1.5 truncate text-muted-foreground">
                      {ev.subject_color ? (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: ev.subject_color }}
                        />
                      ) : (
                        <BookOpen className="w-3 h-3 text-muted-foreground shrink-0" />
                      )}
                      <span className="truncate">{ev.subject_name || ev.course_name}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-[10px]">Evento avulso</span>
                  )}

                  {ev.time && (
                    <span className="text-[10px] font-mono shrink-0 flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-2.5 h-2.5 text-primary" />
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
