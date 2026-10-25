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
  if (totalLessons === 0) return 0;
  const completedLessons = normalizedLessons.filter(
    (lesson) => Boolean(lesson.isCompleted)
  ).length;
  const percentage = (completedLessons / totalLessons) * 100;

  return Math.round(percentage);
}

export function getLessonStats(lessons: Lesson[] | Hierarchy | unknown): {
  total: number;
  completed: number;
  remaining: number;
  percentage: number;
} {
  const normalizedLessons = normalizeLessons(lessons);
  const total = normalizedLessons.length;
  if (total === 0) return { total: 0, completed: 0, remaining: 0, percentage: 0 };
  const completed = normalizedLessons.filter((l) => Boolean(l.isCompleted)).length;
  const remaining = Math.max(0, total - completed);
  const percentage = Math.round((completed / total) * 100);
  return { total, completed, remaining, percentage };
}

export function calculateCourseProgress(lessons: Lesson[] | Hierarchy | unknown) {
  const normalizedLessons = normalizeLessons(lessons);
  if (normalizedLessons.length === 0) return 0;
  const completed = normalizedLessons.filter((l) => Boolean(l.isCompleted));
  return Math.round((completed.length / normalizedLessons.length) * 100);
}

export function getLastViewedLesson(courseId: string): (Lesson & { viewedAt?: number }) | null {
  const lastViewed = localStorage.getItem(courseId);

  if (lastViewed) {
    try {
      return JSON.parse(lastViewed) as Lesson & { viewedAt?: number };
    } catch {
      return null;
    }
  }

  return null;
}

export function setLastViewedLesson(courseId: string, lesson: Lesson) {
  const payload = {
    ...lesson,
    viewedAt: Date.now(),
  };
  localStorage.setItem(courseId, JSON.stringify(payload));
  localStorage.setItem("last_active_course_id", courseId);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("lastViewedLessonUpdated", {
        detail: { courseId, lesson: payload },
      })
    );
  }
}

export function getMostRecentActiveCourse(courses: Course[]): {
  course: Course;
  lesson: (Lesson & { viewedAt?: number }) | null;
  isResume: boolean;
} | null {
  if (!courses || courses.length === 0) return null;

  // 1. Check if there is an explicit last active course in localStorage
  const lastActiveId = localStorage.getItem("last_active_course_id");
  if (lastActiveId) {
    const matched = courses.find((c) => c.id.toString() === lastActiveId);
    if (matched) {
      const lastWatched = getLastViewedLesson(matched.id.toString());
      if (lastWatched) {
        return {
          course: matched,
          lesson: lastWatched,
          isResume: true,
        };
      }
    }
  }

  // 2. Scan all courses for the most recently viewed timestamp
  let bestCourse: Course | null = null;
  let bestLesson: (Lesson & { viewedAt?: number }) | null = null;
  let highestViewedAt = -1;

  for (const course of courses) {
    const lastWatched = getLastViewedLesson(course.id.toString());
    if (lastWatched) {
      const timestamp = lastWatched.viewedAt || 0;
      if (timestamp > highestViewedAt) {
        highestViewedAt = timestamp;
        bestCourse = course;
        bestLesson = lastWatched;
      }
    }
  }

  if (bestCourse && bestLesson) {
    return {
      course: bestCourse,
      lesson: bestLesson,
      isResume: true,
    };
  }

  // 3. Fallback to the first course in the list
  return {
    course: courses[0],
    lesson: null,
    isResume: false,
  };
}


export function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) return "";
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return "hoje";
  }
  if (diffDays === 1) {
    return "ontem";
  }
  return `há ${diffDays} dias`;
}

export function formatRelativeDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return "";
  const targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = today.getTime() - targetDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return "hoje";
  }
  if (diffDays === 1) {
    return "ontem";
  }
  return `há ${diffDays} dias`;
}

