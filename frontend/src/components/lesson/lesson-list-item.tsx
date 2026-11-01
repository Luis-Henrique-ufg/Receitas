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

  return (
    <div
      key={lesson.id}
      id={`lesson-item-${lesson.id}`}
      className={cn(
        `relative flex justify-between items-center w-full h-16 my-2 border shadow-sm rounded-xl transition-all duration-300 overflow-hidden group/item cursor-pointer glass-panel-brighten`,
        isActive
          ? "bg-white/10 border-white/25 shadow-sm"
          : isCompleted
          ? "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.07]"
          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.06]"
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-3 bottom-3 w-1 bg-[#007bff] rounded-r-full z-20" />
      )}
      <div
        className="flex-1 flex gap-3 items-center relative z-10 pl-4 py-2 h-full min-w-0 pr-4"
        onClick={onSelect}
      >
        {isActive ? (
          <div className="w-8 h-8 flex items-center justify-center bg-[#007bff] text-white rounded-full shrink-0">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
        ) : isCompleted ? (
          <span className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-emerald-400 text-xs font-heading font-medium">
            {index.toString().padStart(2, "0")}
          </span>
        ) : (
          <span className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/50 text-xs font-heading font-medium">
            {index.toString().padStart(2, "0")}
          </span>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className={cn(
                "flex-1 line-clamp-1 text-left text-sm font-medium transition-colors",
                isActive
                  ? "text-white font-semibold"
                  : isCompleted
                  ? "text-white/90 group-hover/item:text-white"
                  : "text-white/70 group-hover/item:text-white"
              )}>
                {lesson.title}
              </p>
            </TooltipTrigger>
            <TooltipContent align="start" side="top" className="max-w-[300px]">
              <p>{lesson.title}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <span className="bg-white/5 border border-white/10 text-white/70 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-semibold tracking-wider shrink-0">
          {
            (lesson.video_url || lesson.pdf_url).split(".")[
              (lesson.video_url || lesson.pdf_url).split(".").length - 1
            ]
          }
        </span>
        {lesson.duration != "0" && (
          <span className="bg-white/5 border border-white/10 text-zinc-300 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wider">
            {formatDuration(Number(lesson.duration))}
          </span>
        )}
      </div>
      <div className="shrink-0 flex items-center justify-center relative z-10 pr-6 pl-2">
        <div className="flex items-center justify-center min-w-[32px] min-h-[32px]">
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#007bff]" />
          ) : (
            <Checkbox 
              checked={isCompleted} 
              onCheckedChange={toggleIsCompleted} 
              className={cn(
                "w-5 h-5 transition-all duration-300",
                isCompleted
                  ? "border-emerald-500/40 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:text-white"
                  : "border-white/30 hover:border-white/60"
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}
