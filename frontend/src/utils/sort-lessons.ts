import { Lesson } from "@/models/models";

export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

export function sortLessons(lessons: Lesson[]): Lesson[] {
  return [...lessons].sort((a, b) => naturalCompare(a.title, b.title));
}

