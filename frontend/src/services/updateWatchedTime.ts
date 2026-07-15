import axios from "axios";

export async function updateWatchedTime(
  apiUrl: string,
  lessonId: number,
  currentTime: number
) {
  try {
    fetch(`${apiUrl}/api/update-lesson-progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        time_elapsed: currentTime,
        lessonId,
      }),
      keepalive: true,
    });
  } catch {
    console.log("erro ao atualizar tempo decorrido");
  }
}
