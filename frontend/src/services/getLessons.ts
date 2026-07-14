import { Lesson, Modules } from "@/models/models";

import axios from "axios";

export async function getLessons(
  apiUrl: string,
  courseId: number
): Promise<Modules> {
  try {
    const res = await axios.get<Modules>(
      `${apiUrl}/api/courses/${courseId}/lessons`
    );

    return res.data;
  } catch {
    return {};
  }
}
