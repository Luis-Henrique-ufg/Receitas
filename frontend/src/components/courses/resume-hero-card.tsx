import { useMemo, useState, useEffect } from "react";
import { Play, Sparkles, BookOpen, Clock } from "lucide-react";
import { Course, Lesson } from "@/models/models";
import { Button } from "@/components/ui/button";
import { getLastViewedLesson } from "@/utils/utils";
import useApiUrl from "@/hooks/useApiUrl";
import { coursesApi, CourseCompletionStats } from "@/services/coursesApi";

interface ResumeHeroCardProps {
  courses: Course[];
  onPlay: (courseId: number, lesson?: Lesson) => void;
}

function formatSeconds(secs: number | string | undefined): string {
  if (!secs) return "00:00";
  const num = typeof secs === "string" ? parseFloat(secs) : secs;
  if (isNaN(num) || num <= 0) return "00:00";
  const m = Math.floor(num / 60);
  const s = Math.floor(num % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function cleanLessonTitle(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/^(\d+[\s\-_.]+)+/, "")
    .replace(/\s*•\s*(\d+[\s\-_.]+)+/g, " • ")
    .trim();
}

export function extractLessonIndex(title?: string, hierarchyPath?: string): number | null {
  if (title) {
    const match = title.match(/^(\d+)[\s\-_.]/);
    if (match) return parseInt(match[1], 10);
  }
  if (hierarchyPath) {
    const parts = hierarchyPath.split("/");
    const lastPart = parts[parts.length - 1];
    const match = lastPart.match(/^(\d+)[\s\-_.]/);
    if (match) return parseInt(match[1], 10);
  }
  return null;
}

function middleTruncate(text: string, maxLength: number = 38): string {
  if (!text || text.length <= maxLength) return text;
  const charsToShow = maxLength - 3;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);
  return `${text.slice(0, frontChars)}…${text.slice(-backChars)}`;
}

export default function ResumeHeroCard({ courses, onPlay }: ResumeHeroCardProps) {
  const { apiUrl } = useApiUrl();
  const [totalLessons, setTotalLessons] = useState<number | null>(null);

  const [stats, setStats] = useState<CourseCompletionStats | null>(null);

  const activeItem = useMemo(() => {
    if (!courses || courses.length === 0) return null;

    // 1. Find the first course with a recorded lastViewedLesson in localStorage
    for (const course of courses) {
      const lastWatched = getLastViewedLesson(course.id.toString());
      if (lastWatched) {
        return {
          course,
          lesson: lastWatched,
          isResume: true,
        };
      }
    }

    // 2. Fallback to the first course if no history exists yet
    return {
      course: courses[0],
      lesson: null,
      isResume: false,
    };
  }, [courses]);

  useEffect(() => {
    if (!activeItem?.course) return;
    let isCancelled = false;

    coursesApi
      .getCompletionStats(apiUrl, activeItem.course.id)
      .then((data) => {
        if (!isCancelled && data) {
          setStats(data);
          if (data.total_lessons) {
            setTotalLessons(data.total_lessons);
          }
        }
      })
      .catch(() => {
        // Quiet fallback
      });

    return () => {
      isCancelled = true;
    };
  }, [apiUrl, activeItem?.course]);

  if (!activeItem || !activeItem.course) {
    return null;
  }

  const { course, lesson, isResume } = activeItem;

  const courseCover = course.isCoverUrl
    ? course.urlCover
    : course.fileCover
    ? `${apiUrl}/uploads/${course.fileCover}`
    : "/sem-foto.png";

  const lessonElapsed = lesson?.time_elapsed ? Number(lesson.time_elapsed) : 0;
  const hasSavedPosition = lessonElapsed > 0;

  // Thumbnail progress percentage
  const durationNum = lesson?.duration ? parseFloat(lesson.duration) : 0;
  const thumbnailProgressPct =
    hasSavedPosition && durationNum > 0
      ? Math.min(100, Math.max(3, Math.round((lessonElapsed / durationNum) * 100)))
      : hasSavedPosition
      ? 15
      : 0;

  const lessonIndex = lesson ? extractLessonIndex(lesson.title, lesson.hierarchy_path) : null;
  // Prefer real lesson index from resumed lesson; fallback to completion count
  const effectiveLessonNumber = lessonIndex !== null ? lessonIndex : (stats?.current_lesson_number || null);
  const rawCleanedTitle = lesson ? cleanLessonTitle(lesson.title) : "";
  const cleanedModule = lesson?.module ? cleanLessonTitle(lesson.module) : "";

  // Check if title is generic like "Video", "Aula" or empty
  const isGenericTitle =
    !rawCleanedTitle ||
    rawCleanedTitle.toLowerCase() === "video" ||
    rawCleanedTitle.toLowerCase() === "aula" ||
    /^parte\s*\d+$/i.test(rawCleanedTitle);

  // If generic, use "Aula {N}" or meaningful title
  const displayTitle = isGenericTitle
    ? effectiveLessonNumber
      ? `Aula ${effectiveLessonNumber}`
      : "Aula"
    : rawCleanedTitle;

  const isAlreadyShowingLessonNumber = isGenericTitle && Boolean(effectiveLessonNumber);

  // Avoid repeating the title if module and lesson share the same name or prefix
  const isDuplicateName =
    Boolean(cleanedModule) &&
    Boolean(displayTitle) &&
    (cleanedModule.trim().toLowerCase() === displayTitle.trim().toLowerCase() ||
      displayTitle.trim().toLowerCase().startsWith(cleanedModule.trim().toLowerCase()));

  const showModule = Boolean(cleanedModule) && !isDuplicateName;

  return (
    <div className="w-full glass-panel rounded-2xl p-5 sm:p-6 border border-white/15 shadow-2xl relative overflow-hidden backdrop-blur-2xl group bg-gradient-to-r from-blue-950/20 via-black/40 to-black/60">
      {/* Decorative background glow */}
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-center gap-5 sm:gap-6 relative z-10">
        {/* Cover Thumbnail with optional bottom progress line */}
        <div className="relative w-full md:w-56 aspect-video md:aspect-[16/10] rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-lg group-hover:border-blue-500/40 transition-colors">
          <img
            src={courseCover}
            alt={course.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Thin progress bar over thumbnail when position is saved */}
          {hasSavedPosition && thumbnailProgressPct > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                style={{ width: `${thumbnailProgressPct}%` }}
              />
            </div>
          )}
        </div>

        {/* Content Info */}
        <div className="flex-1 min-w-0 space-y-2 text-left w-full">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              {isResume ? "Continuar de onde parei" : "Comece a estudar"}
            </span>

            {/* Position Display: only show 'Retomar em MM:SS' when time_elapsed > 0 */}
            {isResume && hasSavedPosition && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs text-cyan-200 bg-cyan-950/40 border border-cyan-500/30">
                <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>
                  Retomar em{" "}
                  <span className="font-mono tabular-nums text-white font-medium">
                    {formatSeconds(lessonElapsed)}
                  </span>
                </span>
              </span>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-heading font-bold text-white tracking-tight truncate">
            {course.name}
          </h3>

          {/* Cleaned Lesson Hierarchy Breadcrumb: icon and path inline with min-w-0 */}
          <div className="text-sm text-zinc-300 flex items-center gap-2 min-w-0 max-w-full">
            <BookOpen className="w-4 h-4 text-zinc-400 shrink-0" />
            {isResume && lesson ? (
              <div className="flex items-center gap-1.5 min-w-0 overflow-hidden text-sm">
                {showModule && (
                  <>
                    <span className="text-zinc-400 font-medium truncate max-w-[180px]" title={cleanedModule}>
                      {cleanedModule}
                    </span>
                    <span className="text-zinc-600 font-semibold select-none shrink-0">›</span>
                  </>
                )}
                <strong className="text-white font-medium truncate" title={lesson.title}>
                  {isAlreadyShowingLessonNumber && totalLessons && totalLessons > 0
                    ? `Aula ${effectiveLessonNumber} de ${totalLessons}`
                    : displayTitle}
                </strong>
                {!isAlreadyShowingLessonNumber && effectiveLessonNumber !== null && totalLessons !== null && totalLessons > 0 && (
                  <span className="text-xs text-zinc-400 font-normal shrink-0 ml-1 whitespace-nowrap">
                    (Aula {effectiveLessonNumber} de {totalLessons})
                  </span>
                )}
              </div>
            ) : (
              <span className="truncate">Explore as aulas e comece sua jornada de aprendizado</span>
            )}
          </div>
        </div>

        {/* Action Button: Hover keeps text legible, clean 'Continuar' */}
        <div className="shrink-0 w-full md:w-auto">
          <Button
            onClick={() => onPlay(course.id, lesson || undefined)}
            className="w-full md:w-auto h-11 px-7 rounded-xl bg-gradient-to-r from-blue-600 to-[#007bff] hover:from-blue-500 hover:to-blue-600 text-white hover:text-white font-semibold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm sm:text-base transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white shrink-0" />
            <span>{isResume ? "Continuar" : "Iniciar Curso"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
