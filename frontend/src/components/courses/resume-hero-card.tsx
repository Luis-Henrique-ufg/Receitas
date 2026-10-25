import { useMemo } from "react";
import { Play, Sparkles, BookOpen, Clock } from "lucide-react";
import { Course, Lesson } from "@/models/models";
import { Button } from "@/components/ui/button";
import { getLastViewedLesson } from "@/utils/utils";
import useApiUrl from "@/hooks/useApiUrl";

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

export default function ResumeHeroCard({ courses, onPlay }: ResumeHeroCardProps) {
  const { apiUrl } = useApiUrl();

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

  if (!activeItem || !activeItem.course) {
    return null;
  }

  const { course, lesson, isResume } = activeItem;

  const courseCover = course.isCoverUrl
    ? course.urlCover
    : course.fileCover
    ? `${apiUrl}/uploads/${course.fileCover}`
    : "/sem-foto.png";

  return (
    <div className="w-full glass-panel rounded-2xl p-5 sm:p-7 border border-white/15 shadow-2xl relative overflow-hidden backdrop-blur-2xl group bg-gradient-to-r from-blue-950/20 via-black/40 to-black/60">
      {/* Decorative background glow */}
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
        {/* Cover Thumbnail */}
        <div className="relative w-full md:w-56 aspect-video md:aspect-[16/10] rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-lg group-hover:border-blue-500/40 transition-colors">
          <img
            src={courseCover}
            alt={course.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Content Info */}
        <div className="flex-1 min-w-0 space-y-2 text-left w-full">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              {isResume ? "Continuar de Onde Parei" : "Comece a Estudar"}
            </span>

            {isResume && lesson?.time_elapsed && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono text-zinc-300 bg-white/5 border border-white/10">
                <Clock className="w-3 h-3 text-cyan-400" />
                {formatSeconds(lesson.time_elapsed)} assistidos
              </span>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-heading font-bold text-white tracking-tight truncate">
            {course.name}
          </h3>

          <p className="text-sm text-zinc-300 flex items-center gap-1.5 line-clamp-1">
            <BookOpen className="w-4 h-4 text-zinc-400 shrink-0" />
            {isResume && lesson ? (
              <span>
                {lesson.module ? `${lesson.module} • ` : ""}
                <strong className="text-white font-medium">{lesson.title}</strong>
              </span>
            ) : (
              <span>Explore as aulas e comece sua jornada de aprendizado</span>
            )}
          </p>
        </div>

        {/* Action Button */}
        <div className="shrink-0 w-full md:w-auto">
          <Button
            onClick={() => onPlay(course.id, lesson || undefined)}
            className="w-full md:w-auto h-12 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-[#007bff] hover:from-blue-500 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm sm:text-base transition-transform hover:scale-105 active:scale-95"
          >
            <Play className="w-5 h-5 fill-white shrink-0" />
            <span>{isResume ? "Continuar Aula" : "Iniciar Curso"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
