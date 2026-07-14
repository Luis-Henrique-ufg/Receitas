import { Lesson } from "@/models/models";
import { formatDuration } from "@/utils/format-duration";
import { Checkbox } from "../ui/checkbox";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import useApiUrl from "@/hooks/useApiUrl";
import { cn } from "@/lib/utils";

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
    const localVal = localStorage.getItem(`lesson_progress_${lesson.id}`);
    if (localVal !== null) {
      return localVal === "true";
    }
    return Boolean(lesson.isCompleted);
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const { apiUrl } = useApiUrl();

  // Tenta sincronizar alterações pendentes quando o componente montar
  useEffect(() => {
    const isPending = localStorage.getItem(`lesson_pending_${lesson.id}`);
    if (isPending === "true") {
      const syncProgress = async () => {
        try {
          await axios.post(`${apiUrl}/api/update-lesson-progress`, {
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

    try {
      await axios.post(`${apiUrl}/api/update-lesson-progress`, {
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

  return (
    <div
      key={lesson.id}
      className={cn(
        `flex justify-around items-center w-full h-16 my-6  border-2 shadow-sm rounded-md transition-transform  hover:border-purple-500`,
        selectedLessonId === lesson.id
          ? "   border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:text-white"
          : "dark:bg-neutral-900 bg-neutral-50"
      )}
    >
      <div
        className="w-10/12 cursor-pointer  flex gap-2 items-center"
        onClick={onSelect}
      >
        <code className="h-full pl-4">{index}</code>

        <p className=" flex-1 line-clamp-1 text-left text-xs">{lesson.title}</p>
        <code className="bg-purple-100 dark:bg-neutral-500/20 max-w-min max-h-min p-1 rounded-sm shrink-0 h-6 text-xs">
          {
            (lesson.video_url || lesson.pdf_url).split(".")[
              (lesson.video_url || lesson.pdf_url).split(".").length - 1
            ]
          }
        </code>
        {lesson.duration != "0" && (
          <code className="p-1 bg-blue-500/20 rounded-md px-2 text-xs dark:text-neutral-300">
            {formatDuration(Number(lesson.duration))}
          </code>
        )}
      </div>
      <div className="w-1/12 flex items-center justify-center">
        {isUpdating ? (
          <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
        ) : (
          <Checkbox checked={isCompleted} onCheckedChange={toggleIsCompleted} />
        )}
      </div>
    </div>
  );
}
