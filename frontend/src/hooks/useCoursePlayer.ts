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

      if (!minimal) {
        const lastWatched = getLastViewedLesson(courseId);

        if (lastWatched) {
          selectLesson(lastWatched);
        } else {
          const firstModule = Object.keys(fetchedModules)[0];

          if (fetchedModules[firstModule]?.length > 0) {
            selectLesson(fetchedModules[firstModule][0]);
          }
        }
      }

      setModules(fetchedModules);
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
