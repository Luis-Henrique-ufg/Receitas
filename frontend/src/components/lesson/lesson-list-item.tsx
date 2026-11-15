import { Lesson } from "@/models/models";
import { formatDuration } from "@/utils/format-duration";
import { Checkbox } from "../ui/checkbox";
import { useState, useEffect } from "react";
import { Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import useApiUrl from "@/hooks/useApiUrl";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { lessonsApi } from "@/services/lessonsApi";
import { usePlaybackStore } from "@/store/usePlaybackStore";

type Props = {
  lesson: Lesson;
  selectedLessonId: number | undefined;
  index: number;
  onSelect: () => void;
  onComplete: () => void;
};

export default function LessonListItem({
  lesson,
  selectedLessonId,
  index,
  onSelect,

  onComplete,
}: Props) {
  const [isCompleted, setIsCompleted] = useState(() => {
    const isPending = localStorage.getItem(`lesson_pending_${lesson.id}`) === "true";
    if (isPending) {
      const localVal = localStorage.getItem(`lesson_progress_${lesson.id}`);
      if (localVal !== null) {
        return localVal === "true";
      }
    }
    return Boolean(lesson.isCompleted);
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const { apiUrl } = useApiUrl();
  const lastCompleted = usePlaybackStore((state) => state.lastCompleted);
  const markLessonCompleted = usePlaybackStore((state) => state.markLessonCompleted);

  // Sincroniza o estado quando as propriedades da aula mudarem (ex: refresh após término do vídeo)
  useEffect(() => {
    const isPending = localStorage.getItem(`lesson_pending_${lesson.id}`) === "true";
    if (!isPending) {
      const serverVal = Boolean(lesson.isCompleted);
      setIsCompleted(serverVal);
      localStorage.setItem(`lesson_progress_${lesson.id}`, String(serverVal));
    }
  }, [lesson.id, lesson.isCompleted]);

  // Listener para estado do store e evento de conclusão da aula
  useEffect(() => {
    if (lastCompleted && lastCompleted.lessonId === lesson.id) {
      setIsCompleted(lastCompleted.isCompleted);
      localStorage.setItem(`lesson_progress_${lesson.id}`, String(lastCompleted.isCompleted));
    }
  }, [lastCompleted, lesson.id]);

  useEffect(() => {
    const handleLessonCompleted = (e: Event) => {
      const customEvent = e as CustomEvent<{ lessonId: number; isCompleted?: boolean }>;
      if (customEvent.detail && customEvent.detail.lessonId === lesson.id) {
        const nextState = customEvent.detail.isCompleted ?? true;
        setIsCompleted(nextState);
        localStorage.setItem(`lesson_progress_${lesson.id}`, String(nextState));
      }
    };
    window.addEventListener("lessonCompleted", handleLessonCompleted);
    return () => window.removeEventListener("lessonCompleted", handleLessonCompleted);
  }, [lesson.id]);

  // Tenta sincronizar alterações pendentes quando o componente montar
  useEffect(() => {
    const isPending = localStorage.getItem(`lesson_pending_${lesson.id}`);
    if (isPending === "true") {
      const syncProgress = async () => {
        try {
          await lessonsApi.updateProgress(apiUrl, {
            lessonId: lesson.id,
            isCompleted: isCompleted,
          });
          localStorage.removeItem(`lesson_pending_${lesson.id}`);
        } catch {
          // Continua pendente silenciosamente (Modo Offline)
        }
      };
      syncProgress();
    }
  }, [lesson.id, isCompleted, apiUrl]);

  async function toggleIsCompleted() {
    const newState = !isCompleted;
    setIsCompleted(newState);
    setIsUpdating(true);

    // Salva o progresso offline imediatamente (Cache Optimista)
    localStorage.setItem(`lesson_progress_${lesson.id}`, String(newState));
    localStorage.setItem(`lesson_pending_${lesson.id}`, "true");

    markLessonCompleted(lesson.id, newState);

    try {
      await lessonsApi.updateProgress(apiUrl, {
        lessonId: lesson.id,
        isCompleted: newState,
      });
      // Sucesso: tira flag de pendência
      localStorage.removeItem(`lesson_pending_${lesson.id}`);
      onComplete();
    } catch {
      toast.error("Salvo localmente (Servidor Offline)");
      // Sem rollback: mantém no localStorage para sincronizar depois
    } finally {
      setIsUpdating(false);
    }
  }

  const isActive = selectedLessonId === lesson.id;
  const ext = (lesson.video_url || lesson.pdf_url || "")
    .split(".")
    .pop()
    ?.toLowerCase();

  return (
    <div
      key={lesson.id}
      id={`lesson-item-${lesson.id}`}
      className={cn(
        "relative flex justify-between items-center w-full min-h-[54px] py-2 border rounded-2xl transition-all duration-200 overflow-hidden group/item cursor-pointer",
        isActive
          ? "bg-primary/12 border-primary/45 shadow-sm"
          : isCompleted
          ? "border-border/80 bg-secondary/40 hover:border-primary/40 hover:bg-secondary/75"
          : "border-border bg-card hover:border-primary/40 hover:bg-secondary/55"
      )}
    >
      <div
        className="flex-1 flex gap-2.5 items-center relative z-10 pl-3 py-1 h-full min-w-0 pr-2"
        onClick={onSelect}
      >
        {isActive ? (
          <div className="w-7 h-7 flex items-center justify-center bg-primary text-[#030607] rounded-full shrink-0 shadow-sm">
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          </div>
        ) : isCompleted ? (
          <span className="w-7 h-7 flex items-center justify-center rounded-full bg-accent/15 border border-accent/35 text-accent text-[11px] font-display font-semibold shrink-0">
            {index.toString().padStart(2, "0")}
          </span>
        ) : (
          <span className="w-7 h-7 flex items-center justify-center rounded-full bg-secondary border border-border text-muted-foreground text-[11px] font-display font-semibold shrink-0">
            {index.toString().padStart(2, "0")}
          </span>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <p
                className={cn(
                  "flex-1 line-clamp-1 text-left text-[13px] transition-colors",
                  isActive
                    ? "text-foreground font-display font-semibold"
                    : isCompleted
                    ? "text-muted-foreground group-hover/item:text-foreground font-medium"
                    : "text-foreground group-hover/item:text-primary font-medium"
                )}
              >
                {lesson.title}
              </p>
            </TooltipTrigger>
            <TooltipContent align="start" side="top" className="max-w-[300px]">
              <p>{lesson.title}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {ext && ext !== "mp4" && (
          <span className="bg-secondary border border-border text-muted-foreground px-2 py-0.5 rounded-md text-[10px] uppercase font-mono font-semibold tracking-wider shrink-0">
            {ext}
          </span>
        )}
        {lesson.duration != "0" && Number(lesson.duration) > 0 && (
          <span className="bg-secondary border border-border text-muted-foreground px-2 py-0.5 rounded-md text-[10.5px] font-mono font-medium shrink-0 tabular-nums">
            {formatDuration(Number(lesson.duration))}
          </span>
        )}
      </div>
      <div className="shrink-0 flex items-center justify-center relative z-10 pr-3 pl-1">
        <div className="flex items-center justify-center min-w-[28px] min-h-[28px]">
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Checkbox
              checked={isCompleted}
              onCheckedChange={toggleIsCompleted}
              className={cn(
                "w-4 h-4 transition-all duration-200",
                isCompleted
                  ? "border-accent data-[state=checked]:bg-accent data-[state=checked]:border-accent data-[state=checked]:text-white"
                  : "border-muted-foreground/40 hover:border-primary"
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}
