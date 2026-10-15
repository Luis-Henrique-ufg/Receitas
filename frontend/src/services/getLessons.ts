import { Modules } from "@/models/models";
import { lessonsApi } from "./lessonsApi";

export async function getLessons(
  apiUrl: string,
  courseId: number
): Promise<Modules> {
  try {
    return await lessonsApi.getLessons(apiUrl, courseId);
  } catch {
    return {};
  }
}
