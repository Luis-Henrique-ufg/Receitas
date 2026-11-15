import { useState, useRef, useEffect } from "react";
import { Course } from "@/models/models";
import DeleteCourse from "./delete-course";
import EditCourse from "./edit-course";
import useApiUrl from "@/hooks/useApiUrl";
import CoursePercentage from "../course-percentage";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoreVertical, ArrowRight, Edit3, Trash2, Video, Clock } from "lucide-react";
import { getLastViewedLesson } from "@/utils/utils";
import { coursesApi, CourseCompletionStats } from "@/services/coursesApi";

type Props = {
  course: Course;
  onPlay: () => void;
  isEditable?: boolean;
  isHeroCourse?: boolean;
  onUpdate: () => void;
};

export default function CourseItem({
  course,
  onPlay,
  isEditable,
  isHeroCourse = false,
  onUpdate,
}: Props) {
  const { apiUrl } = useApiUrl();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [stats, setStats] = useState<CourseCompletionStats | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: course.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    let isCancelled = false;
    coursesApi
      .getCompletionStats(apiUrl, course.id)
      .then((data) => {
        if (!isCancelled && data) {
          setStats(data);
        }
      })
      .catch(() => {});
    return () => {
      isCancelled = true;
    };
  }, [apiUrl, course.id]);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const courseCover = course.isCoverUrl
    ? course.urlCover
    : course.fileCover
    ? `${apiUrl}/uploads/${course.fileCover}`
    : "/sem-foto.png";

  const lastWatched = getLastViewedLesson(course.id.toString());
  const ctaLabel = lastWatched ? "Continuar" : "Estudar";
  const completedPct = stats?.completed_percentage ?? 0;
  const isCompleted = completedPct === 100;
  const totalLessons = stats?.total_lessons ?? 0;
  const totalHours = stats?.remaining_seconds ? Math.max(1, Math.round(stats.remaining_seconds / 3600)) : null;

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...(isEditable ? attributes : {})}
      {...(isEditable ? listeners : {})}
      className={`group relative overflow-hidden rounded-3xl bg-card border border-border shadow-sm hover:border-primary hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full ${
        isDragging
          ? "shadow-2xl ring-2 ring-primary z-50 opacity-80"
          : ""
      } ${isEditable ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <div className="flex flex-col flex-1">
        {/* Course Thumbnail with Status Tag and Action Menu */}
        <div className="relative w-full h-48 sm:h-52 overflow-hidden bg-black/20 border-b border-border/80">
          <div className="w-full h-full cursor-pointer overflow-hidden" onClick={onPlay}>
            <img
              className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500 ease-out will-change-transform"
              src={courseCover}
              alt={course.name}
            />
          </div>

          {/* Floating Course Tag Badge */}
          <div className="absolute top-3.5 left-3.5 z-20 pointer-events-none select-none">
            {isCompleted ? (
              <span className="bg-accent text-white text-[10px] sm:text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Concluído
              </span>
            ) : isHeroCourse || lastWatched ? (
              <span className="bg-primary text-[#030607] text-[10px] sm:text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Em Andamento
              </span>
            ) : (
              <span className="bg-secondary/90 text-foreground border border-border text-[10px] sm:text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Curso
              </span>
            )}
          </div>

          {/* Contextual actions menu */}
          {isEditable && (
            <div
              ref={menuRef}
              className="absolute top-3 right-3 z-30"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-8 h-8 rounded-full bg-card/85 hover:bg-card text-foreground/80 hover:text-foreground border border-border backdrop-blur-md shadow-sm flex items-center justify-center transition-all focus:outline-none cursor-pointer"
                title="Opções do curso"
                aria-label="Opções do curso"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-10 w-44 rounded-2xl bg-card border border-border shadow-xl p-1.5 animate-in fade-in slide-in-from-top-2 duration-150 z-40">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsEditDialogOpen(true);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-foreground hover:bg-secondary/70 flex items-center gap-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-primary" />
                    <span>Editar dados</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsDeleteDialogOpen(true);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-destructive hover:bg-destructive/10 flex items-center gap-2 rounded-xl transition-colors cursor-pointer mt-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir curso</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card Body with Title and Progress */}
        <div className="p-5 sm:p-6 flex flex-col gap-3.5 flex-1 justify-between">
          <div>
            <h3
              onClick={onPlay}
              className="text-xl sm:text-2xl font-display font-semibold text-foreground tracking-tight leading-snug line-clamp-2 cursor-pointer hover:text-primary transition-colors text-left"
              title={course.name}
            >
              {course.name}
            </h3>
          </div>

          <div className="w-full mt-auto">
            <CoursePercentage courseId={course.id} />
          </div>
        </div>
      </div>

      {/* Card Footer: Metadata on left, Action pill on right */}
      <div className="px-5 sm:px-6 py-4 border-t border-border/80 flex items-center justify-between bg-card shrink-0">
        <div className="flex items-center gap-3.5 text-xs text-muted-foreground font-medium">
          {totalLessons > 0 && (
            <span className="flex items-center gap-1.5" title={`${totalLessons} aulas no curso`}>
              <Video className="w-3.5 h-3.5 text-primary/80 shrink-0" />
              <span>{totalLessons} aulas</span>
            </span>
          )}
          {totalHours && (
            <span className="flex items-center gap-1.5 hidden sm:flex" title={`Duração estimada de ${totalHours} horas`}>
              <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span>{totalHours}h</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onPlay}
          className="inline-flex items-center gap-1.5 bg-secondary hover:bg-primary text-foreground hover:text-[#030607] border border-border hover:border-primary px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
        >
          <span>{ctaLabel}</span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
        </button>
      </div>

      {/* Controlled Dialogs */}
      <EditCourse
        course={course}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onUpdate={() => {
          setIsEditDialogOpen(false);
          onUpdate();
        }}
      />

      <DeleteCourse
        course={course}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onUpdate={() => {
          setIsDeleteDialogOpen(false);
          onUpdate();
        }}
      />
    </article>
  );
}
