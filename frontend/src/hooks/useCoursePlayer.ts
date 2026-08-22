import { useEffect, useState } from "react";
import useApiUrl from "./useApiUrl";
import useSelectedLesson from "./useSelectedLesson";
import useCourseCompletion from "./useCourseCompletion";
import { Lesson, Modules } from "@/models/models";
import { getLessons } from "@/services/getLessons";
import { getLastViewedLesson, setLastViewedLesson } from "@/utils/utils";

export default function useCoursePlayer(courseId?: string) {
  const [modules, setModules] = useState<Modules>({});
  const [isLoading, setIsLoading] = useState(false);

  const { apiUrl } = useApiUrl();
  const { selectedLesson, selectLesson, clearSelection } = useSelectedLesson();
  const { fetchCompletion } = useCourseCompletion();

  async function loadCourseLessons(minimal = false) {
    if (!courseId) {
      return;
    }

    try {
      if (!minimal) {
        setIsLoading(true);
      }

      const fetchedModules = await getLessons(apiUrl, Number(courseId));
      const cleanModules: Modules = {};
      for (const [mod, lessons] of Object.entries(fetchedModules)) {
        const videoLessons = lessons.filter((l) => {
          const path = (l.video_url || l.pdf_url || "").toLowerCase();
          return !path.endsWith(".html") && !path.endsWith(".htm") && !path.endsWith(".txt");
        });
        if (videoLessons.length > 0) {
          cleanModules[mod] = videoLessons;
        }
      }

      if (!minimal) {
        const lastWatched = getLastViewedLesson(courseId);

        if (lastWatched) {
          selectLesson(lastWatched);
        } else {
          const firstModule = Object.keys(cleanModules)[0];

          if (cleanModules[firstModule]?.length > 0) {
            selectLesson(cleanModules[firstModule][0]);
          }
        }
      } else if (selectedLesson) {
        for (const lessons of Object.values(cleanModules)) {
          const found = lessons.find((l) => l.id === selectedLesson.id);
          if (found) {
            selectLesson(found);
            break;
          }
        }
      }

      setModules(cleanModules);
    } catch {
      console.log("Ocorreu um erro");
    } finally {
      if (!minimal) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    if (!courseId) {
      return;
    }

    clearSelection();
    loadCourseLessons();
  }, [courseId]);

  function selectCourseLesson(lesson: Lesson) {
    if (!courseId) {
      return;
    }

    selectLesson(lesson);
    setLastViewedLesson(courseId, lesson);
  }

  async function refreshCourseProgress() {
    if (!courseId) {
      return;
    }

    await loadCourseLessons(true);
    await fetchCompletion(apiUrl, Number(courseId));
  }

  return {
    modules,
    isLoading,
    selectedLesson,
    selectCourseLesson,
    refreshCourseProgress,
  };
}
