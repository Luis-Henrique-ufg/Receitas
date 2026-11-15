import { useMemo, useState, useEffect } from "react";
import { Play, PlayCircle, Film, CheckCircle2 } from "lucide-react";
import { Course, Lesson } from "@/models/models";
import { getMostRecentActiveCourse } from "@/utils/utils";
import { getCourseCoverPosition } from "@/utils/courseCategory";
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

export default function ResumeHeroCard({ courses, onPlay }: ResumeHeroCardProps) {
  const { apiUrl } = useApiUrl();
  const [totalLessons, setTotalLessons] = useState<number | null>(null);
  const [stats, setStats] = useState<CourseCompletionStats | null>(null);
  const [updateTick, setUpdateTick] = useState(0);

  // Subscribe to real-time lesson progress updates from video playback and navigation
  useEffect(() => {
    const handleUpdate = () => {
      setUpdateTick((prev) => prev + 1);
    };

    window.addEventListener("lastViewedLessonUpdated", handleUpdate);
    window.addEventListener("courseCoverPositionUpdated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("lastViewedLessonUpdated", handleUpdate);
      window.removeEventListener("courseCoverPositionUpdated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const activeItem = useMemo(() => {
    void updateTick;
    return getMostRecentActiveCourse(courses);
  }, [courses, updateTick]);

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
  const coverPosition = getCourseCoverPosition(course);

  const lessonElapsed = lesson?.time_elapsed ? Number(lesson.time_elapsed) : 0;
  const durationNum = lesson?.duration ? parseFloat(lesson.duration) : 0;

  const lessonIndex = lesson ? extractLessonIndex(lesson.title, lesson.hierarchy_path) : null;
  const effectiveLessonNumber = lessonIndex !== null ? lessonIndex : (stats?.current_lesson_number || null);
  const rawCleanedTitle = lesson ? cleanLessonTitle(lesson.title) : "";
  const cleanedModule = lesson?.module ? cleanLessonTitle(lesson.module) : "";

  const isGenericTitle =
    !rawCleanedTitle ||
    rawCleanedTitle.toLowerCase() === "video" ||
    rawCleanedTitle.toLowerCase() === "aula" ||
    /^parte\s*\d+$/i.test(rawCleanedTitle);

  const displayTitle = isGenericTitle
    ? effectiveLessonNumber
      ? `Aula ${effectiveLessonNumber}`
      : "Aula"
    : rawCleanedTitle;

  const showModule = Boolean(cleanedModule) && (cleanedModule.trim().toLowerCase() !== displayTitle.trim().toLowerCase());

  const rawPct = stats?.completed_percentage ?? (
    durationNum > 0 && lessonElapsed > 0 ? (lessonElapsed / durationNum) * 100 : 0
  );
  const completedPct = Math.round(Number(rawPct) || 0);

  const totalCount = totalLessons || stats?.total_lessons || 0;
  const completedCount = stats?.completed_lessons || 0;

  return (
    <section className="w-full bg-card rounded-3xl border border-border tangerina-card overflow-hidden group">
      <div className="grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr] md:min-h-[260px] lg:min-h-[280px]">
        {/* Left Column: Compact Editorial Content */}
        <div className="p-6 sm:p-7 lg:px-10 lg:py-8 flex flex-col justify-between gap-5">
          <div>
            {/* Top Badge */}
            <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.08em] font-bold text-primary mb-2.5 select-none">
              <PlayCircle className="w-4 h-4 text-primary shrink-0" />
              <span>{isResume ? "Continuar de onde parou" : "Estudo Ativo"}</span>
            </div>

            {/* Course Name — Tangerina Display Medium 32px */}
            <h2 className="text-2xl sm:text-[28px] lg:text-[32px] font-display font-medium text-foreground tracking-[-0.02em] leading-[1.15] mb-2.5 line-clamp-2">
              {course.name}
            </h2>

            {/* Lesson details breadcrumb */}
            <div className="flex items-center gap-2 text-[15px] sm:text-[17px] text-muted-foreground font-normal flex-wrap">
              <Film className="w-4 h-4 text-primary shrink-0" />
              <div className="flex items-center gap-1.5 flex-wrap">
                {showModule && (
                  <>
                    <span className="font-normal text-muted-foreground">{cleanedModule}</span>
                    <span className="text-muted-foreground/50 select-none">•</span>
                  </>
                )}
                <span className="text-foreground/90 font-normal">
                  {lesson ? displayTitle : "Explore as aulas deste curso"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-1">
            {/* Progress Bar with High-Contrast Track */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.max(4, Math.min(100, completedPct))}%`,
                  background: "linear-gradient(90deg, #FF7020 0%, #FF9E66 100%)",
                }}
              />
            </div>

            {/* Progress Meta Row */}
            <div className="flex items-center justify-between text-[13px] text-muted-foreground mb-5 font-normal">
              <span>
                Progresso: <strong className="text-foreground font-semibold">{completedPct}% concluído</strong>
              </span>
              {lessonElapsed > 0 && durationNum > 0 ? (
                <span>
                  Tempo: <strong className="text-foreground font-semibold tabular-nums">{formatSeconds(lessonElapsed)} / {formatSeconds(durationNum)}</strong>
                </span>
              ) : totalCount > 0 ? (
                <span>
                  Aulas: <strong className="text-foreground font-semibold">{completedCount} de {totalCount}</strong>
                </span>
              ) : null}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onPlay(course.id, lesson || undefined)}
                className="inline-flex items-center justify-center gap-2.5 bg-primary text-[#030607] font-semibold text-[14.5px] px-6 py-2.5 rounded-xl shadow-[0_4px_14px_rgba(255,112,32,0.3)] hover:-translate-y-0.5 hover:brightness-105 active:scale-98 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current shrink-0" />
                <span>{isResume ? "Retomar Aula" : "Iniciar Curso"}</span>
              </button>

              <button
                type="button"
                onClick={() => onPlay(course.id)}
                className="inline-flex items-center justify-center bg-secondary/70 hover:bg-secondary text-foreground border border-border font-medium text-[13.5px] px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                <span>Ver Todos os Módulos</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Full-Bleed Media (isolated from grid height via md:absolute) */}
        <div className="relative w-full h-52 sm:h-60 md:h-auto overflow-hidden bg-[#2a2522] border-t md:border-t-0 md:border-l border-border">
          <img
            src={courseCover}
            alt={course.name}
            style={{ objectPosition: coverPosition }}
            className="w-full h-full md:absolute md:inset-0 object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent md:hidden" />

          {/* Floating overlay badge */}
          {totalCount > 0 && (
            <div className="absolute bottom-4 right-4 z-10 bg-black/75 backdrop-blur-md text-white text-[12px] font-medium px-3.5 py-1.5 rounded-full flex items-center gap-2 border border-white/15 shadow-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{completedCount} de {totalCount} aulas assistidas</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
