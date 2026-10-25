import { Lesson } from "@/models/models";
import { Player } from "../player/player";
import useApiUrl from "@/hooks/useApiUrl";
import { updateWatchedTime } from "@/services/updateWatchedTime";
import { useEffect, useState, useRef } from "react";
import { lessonsApi } from "@/services/lessonsApi";
import { statsApi } from "@/services/statsApi";

const isDocumentFile = (url: string): boolean => {
  return (
    url.toLowerCase().endsWith(".txt") ||
    url.toLowerCase().endsWith(".pdf") ||
    url.toLowerCase().endsWith(".html")
  );
};

const getResourcePath = (lesson: Lesson): string => {
  return `/serve-content?path=${encodeURIComponent(
    lesson.pdf_url || lesson.video_url || ""
  )}`;
};

type Props = {
  lesson: Lesson | null;
  courseId?: number;
  courseName?: string;
  onLessonComplete?: (lessonId: number) => void;
};

export default function LessonViewer({
  lesson,
  courseId,
  courseName,
  onLessonComplete,
}: Props) {
  const [elapsedTime, setElapsedTime] = useState<number>(
    lesson?.time_elapsed || 0
  );
  const { apiUrl } = useApiUrl();
  const isDocument = lesson
    ? isDocumentFile(lesson.pdf_url || lesson.video_url)
    : false;
  const currentLessonIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!lesson) return;

    if (currentLessonIdRef.current === lesson.id) {
      return;
    }
    currentLessonIdRef.current = lesson.id;

    const fetchElapsedTime = async () => {
      try {
        const time = await lessonsApi.getElapsedTime(apiUrl, lesson.id);
        if (time !== undefined) {
          setElapsedTime(time);
        }
      } catch (error) {
        console.error("Erro ao buscar o tempo decorrido da aula:", error);
      }
    };

    fetchElapsedTime();
  }, [lesson, apiUrl]);

  // Track study time when reading documents/PDFs
  useEffect(() => {
    if (!isDocument || !lesson) return;

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void statsApi
          .recordHeartbeat(apiUrl, 15, courseId, courseName)
          .then(() => {
            window.dispatchEvent(new CustomEvent("statsUpdated"));
          })
          .catch((err) => console.error("Erro ao registrar estudo de documento:", err));
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [isDocument, lesson, apiUrl, courseId, courseName]);

  const handleTimeUpdate = (currentTime: number) => {
    if (!lesson) return;
    const lessonId = currentLessonIdRef.current ?? lesson.id;
    updateWatchedTime(apiUrl, lessonId, currentTime);
  };

  if (!lesson) {
    return null;
  }

  return (
    <div className="shrink-0 w-full">
      {isDocument ? (
        <iframe
          className="w-full h-full aspect-[9/16]"
          src={`${apiUrl}${getResourcePath(lesson)}`}
        ></iframe>
      ) : (
        <Player
          title={lesson.title}
          src={`${apiUrl}${getResourcePath(lesson)}`}
          lessonId={currentLessonIdRef.current ?? lesson.id}
          courseId={courseId}
          courseName={courseName}
          onTimeUpdate={handleTimeUpdate}
          timeElapsed={elapsedTime}
          isEnding={onLessonComplete}
        />
      )}
    </div>
  );
}

