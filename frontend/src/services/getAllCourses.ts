import { Course } from "@/models/models";
import { coursesApi } from "./coursesApi";

export async function getAllCourses(apiUrl: string): Promise<Course[] | null> {
  try {
    return await coursesApi.getAll(apiUrl);
  } catch {
    return null;
  }
}
