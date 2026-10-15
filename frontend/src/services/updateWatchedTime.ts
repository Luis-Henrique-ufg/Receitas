import { lessonsApi } from "./lessonsApi";

export async function updateWatchedTime(
  apiUrl: string,
  lessonId: number,
  currentTime: number
) {
  try {
    await lessonsApi.updateProgress(apiUrl, {
      lessonId,
      time_elapsed: currentTime,
    });
  } catch {
    console.log("erro ao atualizar tempo decorrido");
  }
}
