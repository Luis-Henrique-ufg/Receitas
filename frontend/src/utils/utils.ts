import { Hierarchy, Lesson } from "@/models/models";

export function organizeLessonsInHierarchy(lessons: Lesson[]): Hierarchy {
  const hierarchy: Hierarchy = {};

  lessons.forEach((lesson) => {
    const pathParts = lesson.hierarchy_path.split("/");
    let currentLevel = hierarchy;

    pathParts.forEach((part, index) => {
      if (index === pathParts.length - 1) {
        if (!currentLevel[part]) {
          currentLevel[part] = [];
        }
        (currentLevel[part] as Lesson[]).push(lesson);
      } else {
        if (!currentLevel[part]) {
          currentLevel[part] = {};
        }
        currentLevel = currentLevel[part] as Hierarchy;
      }
    });
  });
  return hierarchy;
}

export function flattenHierarchy(hierarchy: Hierarchy): Lesson[] {
  const lessons: Lesson[] = [];

  Object.values(hierarchy).forEach((item) => {
    if (Array.isArray(item)) {
      lessons.push(...item);
    } else {
      lessons.push(...flattenHierarchy(item));
    }
  });

  return lessons;
}

function normalizeLessons(lessons: Lesson[] | Hierarchy | unknown): Lesson[] {
  if (Array.isArray(lessons)) {
    return lessons;
  }

  if (lessons && typeof lessons === "object") {
    return flattenHierarchy(lessons as Hierarchy);
  }

  return [];
}

export function calculateCompletionPercentage(lessons: Lesson[] | Hierarchy | unknown): number {
  const normalizedLessons = normalizeLessons(lessons);
  const totalLessons = normalizedLessons.length;
  const completedLessons = normalizedLessons.filter(
    (lesson) => lesson.isCompleted === 1
  ).length;
  const percentage = (completedLessons / totalLessons) * 100;

  return percentage;
}

export function calculateCourseProgress(lessons: Lesson[] | Hierarchy | unknown) {
  const normalizedLessons = normalizeLessons(lessons);
  const completed = normalizedLessons.filter((l) => l.isCompleted);
  return (completed.length / normalizedLessons.length) * 100;
}

export function getLastViewedLesson(courseId: string) {
  const lastViewed = localStorage.getItem(courseId);

  if (lastViewed) {
    try {
      return JSON.parse(lastViewed) as Lesson;
    } catch {
      return null;
    }
  }

  return null;
}

export function setLastViewedLesson(courseId: string, lesson: Lesson) {
  localStorage.setItem(courseId, JSON.stringify(lesson));
}
