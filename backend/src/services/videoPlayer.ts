import axios from "axios";
import { toast } from "sonner";

export async function completeLesson(apiUrl: string, lessonId: number, quiet: boolean = false) {
  if (lessonId) {
    const requestData = {
      lessonId: lessonId,
      progressStatus: "started",
      isCompleted: true,
    };

    if (!quiet) toast.success("Aula concluída");

    try {
      await axios.post(`${apiUrl}/api/update-lesson-progress`, requestData);
    } catch {
      if (!quiet) toast.error("Erro ao atualizar o progresso da lição");
    }
  }
}
