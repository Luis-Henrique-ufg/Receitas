import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { pomodoroApi, PomodoroSessionItem } from "@/services/pomodoroApi";
import { formatDuration } from "@/utils/utils";
import { Clock, Trash2, Calendar, Flame, BookOpen, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import useApiUrl from "@/hooks/useApiUrl";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateStr: string | null;
  dateLabel?: string;
  onSessionDeleted?: () => void;
}

export default function SessionsDialog({
  open,
  onOpenChange,
  dateStr,
  dateLabel,
  onSessionDeleted,
}: Props) {
  const { apiUrl } = useApiUrl();
  const [sessions, setSessions] = useState<PomodoroSessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!dateStr) return;
    try {
      setIsLoading(true);
      const data = await pomodoroApi.getSessions(apiUrl, dateStr);
      setSessions(data);
    } catch {
      toast.error("Erro ao carregar sessões de foco.");
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, dateStr]);

  useEffect(() => {
    if (open && dateStr) {
      setConfirmDeleteId(null);
      void fetchSessions();
    }
  }, [open, dateStr, fetchSessions]);

  const handleDelete = async (sessionId: number) => {
    try {
      setDeletingId(sessionId);
      await pomodoroApi.deleteSession(apiUrl, sessionId);
      toast.success("Sessão de foco excluída do gráfico!");
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setConfirmDeleteId(null);
      window.dispatchEvent(new CustomEvent("statsUpdated"));
      onSessionDeleted?.();
    } catch {
      toast.error("Erro ao excluir sessão de foco.");
    } finally {
      setDeletingId(null);
    }
  };

  const totalSeconds = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
  const totalPomodoros = sessions.reduce((acc, s) => acc + (s.pomodoros || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border text-foreground rounded-3xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground font-display text-lg">
            <Calendar className="w-5 h-5 text-primary" />
            Sessões de Foco · {dateLabel || dateStr}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            {sessions.length > 0
              ? `Total de ${formatDuration(totalSeconds)} em ${totalPomodoros} ${
                  totalPomodoros === 1 ? "pomodoro" : "pomodoros"
                }. Exclua registros incorretos para recalcular o gráfico.`
              : "Visualize ou remova sessões registradas nesta data."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs">Carregando sessões...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2 border border-dashed border-border rounded-2xl p-4">
              <AlertCircle className="w-8 h-8 text-muted-foreground/50" />
              <p className="text-xs font-medium">Nenhuma sessão de foco encontrada para esta data.</p>
            </div>
          ) : (
            sessions.map((s) => {
              const isConfirming = confirmDeleteId === s.id;
              const isDeleting = deletingId === s.id;

              return (
                <div
                  key={s.id}
                  className="p-3 rounded-2xl border border-border bg-secondary/40 hover:bg-secondary/60 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold uppercase tracking-wider flex items-center gap-1 shrink-0"
                        style={{
                          backgroundColor: `${s.subject_color || "#FF7020"}1f`,
                          color: s.subject_color || "#FF7020",
                          border: `1px solid ${s.subject_color || "#FF7020"}40`,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: s.subject_color || "#FF7020" }}
                        />
                        {s.subject_name || "Sem matéria"}
                      </span>

                      {s.start_time && s.end_time && (
                        <span className="text-muted-foreground font-mono text-[11px] tabular-nums">
                          {s.start_time} → {s.end_time}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-foreground font-medium">
                      <span className="flex items-center gap-1 font-mono font-bold tabular-nums">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        {formatDuration(s.duration_seconds)}
                      </span>
                      {s.pomodoros > 0 && (
                        <span className="flex items-center gap-1 text-muted-foreground tabular-nums">
                          <Flame className="w-3.5 h-3.5 text-primary/80" />
                          {s.pomodoros} {s.pomodoros === 1 ? "pomodoro" : "pomodoros"}
                        </span>
                      )}
                    </div>

                    {s.course_name && (
                      <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                        <BookOpen className="w-3 h-3 shrink-0" />
                        {s.course_name}
                      </p>
                    )}

                    {s.intention && (
                      <p className="text-[11px] text-muted-foreground italic truncate">
                        "{s.intention}"
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center">
                    {isConfirming ? (
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDeleteId(null)}
                          className="h-8 px-2 text-[11px] text-muted-foreground hover:text-foreground rounded-lg"
                        >
                          Não
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={isDeleting}
                          onClick={() => handleDelete(s.id)}
                          className="h-8 px-2 text-[11px] font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-1"
                        >
                          {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Excluir"}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmDeleteId(s.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                        title="Excluir esta sessão e descontar do gráfico"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
