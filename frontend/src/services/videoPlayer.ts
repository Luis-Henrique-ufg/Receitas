import { toast } from "sonner";
import { lessonsApi } from "./lessonsApi";

export async function completeLesson(apiUrl: string, lessonId: number, quiet: boolean = false) {
  if (lessonId) {
    const requestData = {
      lessonId: lessonId,
      progressStatus: "started",
      isCompleted: true,
    };

    localStorage.setItem(`lesson_progress_${lessonId}`, "true");
    localStorage.removeItem(`lesson_pending_${lessonId}`);

    window.dispatchEvent(
      new CustomEvent("lessonCompleted", {
        detail: { lessonId, isCompleted: true },
      })
    );

    if (!quiet) toast.success("Aula concluída");

    try {
      await lessonsApi.updateProgress(apiUrl, requestData);
    } catch {
      if (!quiet) toast.error("Erro ao atualizar o progresso da lição");
    }
  }
}
